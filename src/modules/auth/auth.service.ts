import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ChangePasswordDto, LoginDto, UpdateProfileDto } from './dtos';
import { TokenResponse } from './types';
import {
  LoginService,
  RefreshTokenService,
  RegisterService,
  TokenService,
  CommonService,
} from './services';
import { VerificationService } from '../verification/verification.service';

import { AuthErrorMessageEnum, CommonErrorMessagesEnum } from 'libs/common/enums';
import { CreateUserDto } from '../users/dtos';
import { AccountIdentifier } from '@prisma/client';
import { DatabaseService } from '@/database/database.service';
import { ResetPasswordWithOTPEmailDto } from './dtos/forgot-password.dto';
import { hashPassword } from 'libs/common';
import { EmailTypeEnum } from '@/communication/email/types';
import { User } from '../users/models';

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
  ) { }

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
    try {
      const payload = this.tokenService.verifyRefreshToken(refreshToken);

      if (!payload || !payload.jti) {
        throw new HttpException(
          {
            status: HttpStatus.UNAUTHORIZED,
            message: 'Invalid refresh token payload',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      const token = await this.refreshTokenService.validateRefreshToken(payload.jti);

      if (!token) {
        throw new HttpException(
          {
            status: HttpStatus.UNAUTHORIZED,
            message: 'Refresh token not found',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (token.isRevoked) {
        throw new HttpException(
          {
            status: HttpStatus.UNAUTHORIZED,
            message: 'Refresh token has been revoked',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (token.expiresAt < new Date()) {
        throw new HttpException(
          {
            status: HttpStatus.UNAUTHORIZED,
            message: 'Refresh token has expired',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Rest of the code remains the same
      const [newAccessToken, newRefreshToken] = await Promise.all([
        this.tokenService.generateAccessToken(token.user),
        this.refreshTokenService.createRefreshToken(token.userId, token.ip, token.device),
      ]);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        accessTokenExpires: this.tokenService.getTokenExpiration('JWT_ACCESS_TOKEN_EXPIRED'),
      };
    } catch (error) {
      // Log the error for debugging
      console.error('Refresh token error:', error);

      // Add logging for failed attempts
      console.error('Failed refresh token attempt:', {
        error: error.message,
        token: refreshToken.substring(0, 10) + '...', // Log partial token for tracking
        timestamp: new Date().toISOString(),
      });

      // If it's already an HTTP exception, rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // Otherwise, throw a generic error
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          message: 'Invalid refresh token',
          error: error.message,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
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
    console.log('[AuthService] resetPasswordWithEmail - Bắt đầu đặt lại mật khẩu cho:', { email: dto.email, userId: user.id });

    // Verify OTP
    await this.verificationService.verifyCode(user.id, dto.code, AccountIdentifier.EMAIL);
    console.log('[AuthService] resetPasswordWithEmail - OTP hợp lệ');

    // Check if new password is same as old password
    const isSameAsOldPassword = await this.loginService.comparePassword(dto.newPassword, user.password);
    if (isSameAsOldPassword) {
      console.log('[AuthService] resetPasswordWithEmail - Lỗi: Mật khẩu mới trùng với mật khẩu cũ');
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: 'Mật khẩu mới không được trùng với mật khẩu cũ',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Update password
    const hashedPassword = await hashPassword(dto.newPassword);
    await this.databaseService.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    console.log('[AuthService] resetPasswordWithEmail - Đã cập nhật mật khẩu mới');

    // Revoke all refresh tokens for security
    await this.refreshTokenService.revokeAllUserTokens(user.id);
    console.log('[AuthService] resetPasswordWithEmail - Đã thu hồi tất cả token');

    return {
      success: true,
      message: 'Đặt lại mật khẩu thành công',
    };
  }

  /**
   * Verify OTP code for forgot password (without resetting yet)
   * This allows for a separate verification step before password reset
   */
  async verifyForgotPasswordOTP(email: string, code: string) {
    console.log('[AuthService] verifyForgotPasswordOTP called:', { email, code: code.substring(0, 2) + '****' });

    const user = await this.loginService.findUserOrThrow(email, 'email');
    console.log('[AuthService] User found for OTP verification:', { userId: user.id, email });

    // Verify OTP without deleting (so it can be used for password reset)
    const result = await this.verificationService.verifyCodeWithOutDelete(user.id, code, AccountIdentifier.EMAIL);
    console.log('[AuthService] OTP verification result:', result);

    return {
      success: true,
      message: 'OTP verified successfully',
      userId: user.id,
    };
  }

  async getProfile(userId: string): Promise<User> {
    return this.loginService.findUserByIdOrThrow(userId);
  }

  private validateContactUpdate(
    identifier_type: AccountIdentifier,
    updateProfileDto: UpdateProfileDto,
  ) {
    // Combined validation for both email and phone
    if (
      (updateProfileDto.email && identifier_type === AccountIdentifier.EMAIL) ||
      (updateProfileDto.phone && identifier_type === AccountIdentifier.PHONE)
    ) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: `Cannot update ${identifier_type.toLowerCase()} when registered with ${identifier_type.toLowerCase()}`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async validateContactUniqueness(userId: string, email?: string, phone?: string) {
    if (email) {
      const existingUser = await this.databaseService.user.findUnique({
        where: { email },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new HttpException(
          {
            status: HttpStatus.CONFLICT,
            message: CommonErrorMessagesEnum.EmailExisted,
          },
          HttpStatus.CONFLICT,
        );
      }
    }

    if (phone) {
      const existingUser = await this.databaseService.user.findUnique({
        where: { phone },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new HttpException(
          {
            status: HttpStatus.CONFLICT,
            message: CommonErrorMessagesEnum.PhoneExisted,
          },
          HttpStatus.CONFLICT,
        );
      }
    }
  }

  private prepareUpdateProfile(updateProfileDto: UpdateProfileDto): Partial<UpdateProfileDto> {
    return Object.entries(updateProfileDto).reduce<Partial<UpdateProfileDto>>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {},
    );
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
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

    this.validateContactUpdate(user.identifier_type, updateProfileDto);

    await this.validateContactUniqueness(userId, updateProfileDto.email, updateProfileDto.phone);

    const updateData = this.prepareUpdateProfile(updateProfileDto) as any;

    return this.databaseService.user.update({
      where: { id: userId },
      data: updateData,
      omit: {
        password: true,
      },
      include: {
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  notIn: ['CANCELLED', 'REJECTED', 'PENDING'],
                },
              },
            },
          },
        },
      },
    });
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: 'New password and confirm password do not match',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

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

    const isPasswordValid = await this.loginService.comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          message: 'Current password is incorrect',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const hashedNewPassword = await hashPassword(newPassword);

    await this.databaseService.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Revoke all refresh tokens for security
    await this.refreshTokenService.revokeAllUserTokens(userId);

    return {
      message: 'Password changed successfully',
    };
  }

  async verifyAccessToken(accessToken: string) {
    return this.tokenService.verifyAccessToken(accessToken);
  }
}
