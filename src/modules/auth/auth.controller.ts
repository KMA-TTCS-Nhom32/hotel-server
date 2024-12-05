import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Get,
  Req,
  Ip,
  Headers,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolesGuard } from './guards/roles.guard';
import { AccountIdentifier, UserRole } from '@prisma/client';
import { Request } from 'express';

import { LoginThrottlerGuard } from './guards/login-throttler.guard';
import { AuthService } from './auth.service';
import {
  LoginDto,
  LoginResponseDto,
  RegisterResponseDto,
  VerifyEmailDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  SessionResponseDto,
  RevokeSessionResponseDto,
  LogoutResponseDto,
  InitiateForgotPasswordEmailDto,
  ResetPasswordWithOTPEmailDto,
} from './dtos';
import { JwtUser } from './types';
import { Public, Roles } from './decorators';

import { CreateUserDto } from '../users/dtos';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LoginThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: LoginResponseDto,
  })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<LoginResponseDto> {
    return this.authService.authenticate(loginDto, ip, userAgent);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Exchange a valid refresh token for a new access token and refresh token pair',
  })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
  })
  async refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user',
    description: 'Revoke the current refresh token, effectively logging out the user',
  })
  @ApiOkResponse({
    description: 'User logged out successfully',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated',
  })
  async logout(@Req() req: Request) {
    const user = req.user as JwtUser;
    await this.authService.revokeRefreshToken(user.userId);
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: RegisterResponseDto,
  })
  async register(
    @Body() createUserDto: CreateUserDto,
    @Body('accountIdentifier') accountIdentifier: AccountIdentifier = AccountIdentifier.EMAIL,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(createUserDto, accountIdentifier);
  }

  @Get('sessions')
  @ApiOperation({
    summary: 'Get active sessions',
    description: 'Retrieve all active sessions for the current user',
  })
  @ApiOkResponse({
    description: 'List of active sessions',
    type: SessionResponseDto,
  })
  async getActiveSessions(@Req() req: Request) {
    const user = req.user as JwtUser;
    // Get current session ID from token if needed
    return this.authService.getUserActiveSessions(user.userId);
  }

  @Post('sessions/:sessionId/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke specific session',
    description: 'Revoke a specific session by its ID',
  })
  @ApiOkResponse({
    description: 'Session revoked successfully',
    type: RevokeSessionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  async revokeSession(@Param('sessionId') sessionId: string, @Req() req: Request) {
    const user = req.user as JwtUser;
    await this.authService.revokeRefreshToken(user.userId, sessionId);
    return { message: 'Session revoked successfully' };
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('sessions/analytics')
  @ApiOperation({
    summary: 'Get session analytics',
    description: 'Get analytics data for user sessions. Requires ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have required permissions',
  })
  async getSessionAnalytics(@Query('userId') userId?: string) {
    return this.authService.getSessionAnalytics(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users/:userId/suspicious-activities')
  @ApiOperation({
    summary: 'Get suspicious activities',
    description: 'Get suspicious activities for a specific user. Requires ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have required permissions',
  })
  async getSuspiciousActivities(@Param('userId') userId: string) {
    return this.authService.getSuspiciousActivities(userId);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP code' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Email verified successfully' })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Invalid verification code',
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyConfirmOTPAndUpdateUser(
      verifyEmailDto.userId,
      verifyEmailDto.code,
      AccountIdentifier.EMAIL,
    );
  }

  @Post('forgot-password/email/initiate')
  @Public()
  @ApiOperation({ summary: 'Initiate forgot password process' })
  async initiateForgotPassword(@Body() dto: InitiateForgotPasswordEmailDto) {
    return this.authService.initiateForgotPasswordForEmail(dto.email);
  }

  @Post('forgot-password/email/reset')
  @Public()
  @ApiOperation({ summary: 'Reset password using OTP' })
  async resetPasswordWithOTP(@Body() dto: ResetPasswordWithOTPEmailDto) {
    return this.authService.resetPasswordWithEmail(dto);
  }
}
