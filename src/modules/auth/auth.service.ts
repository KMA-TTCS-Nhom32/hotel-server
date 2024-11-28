import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginDto } from './dtos';
import { TokenResponse } from './types';
import { LoginService, RefreshTokenService, RegisterService, TokenService } from './services';
import { AuthErrorMessageEnum, CommonErrorMessagesEnum } from 'libs/common/enums';
import { CreateUserDto } from '../users/dtos';
import { AccountIdentifier } from '@prisma/client';
import { VerificationService } from '../verification/verification.service';
import { DatabaseService } from '@/database/database.service';
import { CommonService } from './services/common.service';
import { ResetPasswordWithOTPEmailDto } from './dtos/forgot-password.dto';
import { hashPassword } from 'libs/common';
import { EmailTypeEnum } from '@/communication/email/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly loginService: LoginService,
    private readonly registerService: RegisterService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly verificationService: VerificationService,
    private readonly databaseService: DatabaseService,
    private readonly commonService: CommonService,
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
    return this.registerService.register(createUserDto, accountIdentifier);
  }

  async verifyUserEmail(userId: string) {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          message: CommonErrorMessagesEnum.UserNotFound,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const updatedUser = await this.databaseService.user.update({
      where: { id: userId },
      data: { verified_email: true },
      select: {
        id: true,
        email: true,
        verified_email: true,
      },
    });

    return {
      message: 'Email verified successfully',
      user: updatedUser,
    };
  }

  async verifyConfirmOTPAndUpdateUser(userId: string, code: string, type: AccountIdentifier) {
    // First verify the OTP
    const verificationResult = await this.verificationService.verifyCode(userId, code, type);

    if (!verificationResult.success) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message: 'Invalid verification code',
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // If OTP is valid and type is EMAIL, update user's email verification status
    if (type === AccountIdentifier.EMAIL) {
      return this.verifyUserEmail(userId);
    }

    // Handle other verification types here in the future
    return verificationResult;
  }

  async initiateForgotPasswordForEmail(email: string) {
    const user = await this.loginService.findUserOrThrow(email, 'email');

    await this.commonService.sendVerificationCodeEmail(
      user.id,
      email,
      EmailTypeEnum.FORGOT_PASSWORD,
    );

    return {
      success: true,
      message: 'Reset code has been sent to your email',
    };
  }

  async resetPasswordWithEmail(dto: ResetPasswordWithOTPEmailDto) {
    const user = await this.loginService.findUserOrThrow(dto.email, 'email');

    // Verify OTP
    await this.verificationService.verifyCode(user.id, dto.code, AccountIdentifier.EMAIL);

    // Update password
    const hashedPassword = await hashPassword(dto.newPassword);
    await this.databaseService.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Revoke all refresh tokens for security
    await this.refreshTokenService.revokeAllUserTokens(user.id);

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  }
}
