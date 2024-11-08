import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '@/database/database.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import { RefreshTokenPayload, ActiveSession } from '../types';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

  async createRefreshToken(userId: string, ip?: string, device?: string) {
    const token = await this.databaseService.refreshToken.create({
      data: {
        token: uuidv4(),
        userId,
        ip,
        device,
        expiresAt: new Date(
          Date.now() + this.getRefreshTokenTTL()
        ),
      },
    });

    const payload: RefreshTokenPayload = {
      jti: token.id,
      sub: userId,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRED'),
    });
  }

  async validateRefreshToken(tokenId: string) {
    return await this.databaseService.refreshToken.findUnique({
      where: { id: tokenId },
      include: { user: true },
    });
  }

  async revokeRefreshToken(userId: string, tokenId?: string) {
    if (tokenId) {
      await this.databaseService.refreshToken.update({
        where: { id: tokenId },
        data: { isRevoked: true },
      });
    } else {
      await this.databaseService.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }
  }

  async getUserActiveSessions(userId: string, currentTokenId?: string): Promise<ActiveSession[]> {
    const activeSessions = await this.databaseService.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        device: true,
        ip: true,
        createdAt: true,
        expiresAt: true
      }
    });

    return activeSessions.map(session => ({
      id: session.id,
      device: session.device,
      ip: session.ip,
      lastUsed: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrentSession: session.id === currentTokenId
    }));
  }

  async getSessionAnalytics(userId?: string) {
    const where = userId ? { userId } : {};
    return this.databaseService.refreshToken.groupBy({
      by: ['device'],
      where: {
        ...where,
        isRevoked: false,
        expiresAt: { gt: new Date() }
      },
      _count: true,
      orderBy: {
        _count: {
          device: 'desc'
        }
      }
    });
  }

  async getSuspiciousActivities(userId: string) {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.databaseService.refreshToken.findMany({
      where: {
        userId,
        createdAt: { gt: last24Hours },
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        ip: true,
        device: true,
        createdAt: true,
      }
    });
  }

  private getRefreshTokenTTL(): number {
    const expiration = this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRED') || '7d';
    return expiration.includes('d') 
      ? parseInt(expiration) * 24 * 60 * 60 * 1000 
      : parseInt(expiration) * 1000;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupRefreshTokens() {
    console.log('Cleaning up expired refresh tokens...');
    const now = new Date();
    await this.databaseService.refreshToken.deleteMany({
      where: {
        OR: [
          { isRevoked: true },
          { expiresAt: { lt: now } },
          { createdAt: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } }
        ]
      }
    });
  }
}
