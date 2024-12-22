import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { JwtPayload, RefreshTokenPayload } from '../types';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(user: Omit<User, 'password'>) {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      identifierType: user.identifier_type,
      identifier: user[user.identifier_type.toLowerCase()],
    };
    return this.jwtService.sign(payload);
  }

  getTokenExpiration(configKey: string): number {
    const expiration = this.configService.get<string>(configKey) || '5m';
    const milliseconds = expiration.includes('m')
      ? parseInt(expiration) * 60 * 1000
      : parseInt(expiration) * 1000;
    return Date.now() + milliseconds;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return this.jwtService.verify<RefreshTokenPayload>(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      throw error;
    }
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token);
  }
}
