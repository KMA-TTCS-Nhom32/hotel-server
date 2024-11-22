import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { TokenService } from './services/token.service';
import { LoginService } from './services/login.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { LoginDto } from './dtos';
import { TokenResponse } from './types';
import { AuthErrorMessageEnum } from 'libs/common/enums';
import { CreateUserDto } from '../users/dtos';
import { UsersService } from '../users/users.service';
import { AccountIdentifier } from '@prisma/client';
import { VerificationService } from '../verification/verification.service';
import { EmailService } from '@/communication/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly loginService: LoginService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly userService: UsersService,
    private readonly verificationService: VerificationService,
    private readonly emailService: EmailService,
  ) {}

  async authenticate(loginDto: LoginDto, ip?: string, device?: string) {
    const user = await this.loginService.validateLogin(loginDto.emailOrPhone, loginDto.password);

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.generateAccessToken(user),
      this.refreshTokenService.createRefreshToken(user.id, ip, device),
    ]);

    const accessTokenExpires = this.tokenService.getTokenExpiration('JWT_ACCESS_TOKEN_EXPIRED');

    return {
      accessToken,
      accessTokenExpires,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    const token = await this.refreshTokenService.validateRefreshToken(payload.jti);

    if (!token || token.isRevoked || token.expiresAt < new Date()) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          message: AuthErrorMessageEnum.InvalidRefreshToken,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.refreshTokenService.revokeRefreshToken(token.userId, token.id);

    const [newAccessToken, newRefreshToken] = await Promise.all([
      this.tokenService.generateAccessToken(token.user),
      this.refreshTokenService.createRefreshToken(token.userId, token.ip, token.device),
    ]);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      accessTokenExpires: this.tokenService.getTokenExpiration('JWT_ACCESS_TOKEN_EXPIRED'),
    };
  }

  async revokeRefreshToken(userId: string, tokenId?: string) {
    return this.refreshTokenService.revokeRefreshToken(userId, tokenId);
  }

  async getUserActiveSessions(userId: string) {
    return this.refreshTokenService.getUserActiveSessions(userId);
  }

  async getSessionAnalytics(userId: string) {
    return this.refreshTokenService.getSessionAnalytics(userId);
  }

  async getSuspiciousActivities(userId: string) {
    return this.refreshTokenService.getSuspiciousActivities(userId);
  }

  async register(createUserDto: CreateUserDto, accountIdentifier: AccountIdentifier) {
    if (accountIdentifier === AccountIdentifier.PHONE && !createUserDto.phone) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: AuthErrorMessageEnum.PhoneIsRequired,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (accountIdentifier === AccountIdentifier.EMAIL && !createUserDto.email) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: AuthErrorMessageEnum.EmailIsRequired,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Create the user
    const user = await this.userService.create(createUserDto);

    // Generate verification code
    const verification = await this.verificationService.createVerification(
      user.id,
      accountIdentifier,
    );

    // Send verification email if email registration
    if (accountIdentifier === AccountIdentifier.EMAIL && user.email) {
      await this.emailService.queueVerificationEmail({
        to: user.email,
        code: verification.code,
      });
    }

    // Return the created user (excluding sensitive data)
    return {
      user,
      message: accountIdentifier === AccountIdentifier.EMAIL 
        ? 'Registration successful. Please check your email for verification code.'
        : 'Registration successful. Please verify your phone number.',
    };
  }
}
