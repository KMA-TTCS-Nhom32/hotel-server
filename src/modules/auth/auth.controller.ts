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
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { LoginThrottlerGuard, RefreshThrottlerGuard, RolesGuard } from './guards';
import { AccountIdentifier, UserRole } from '@prisma/client';
import { Request } from 'express';

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
  RegisterDto,
  UpdateProfileDto,
  ChangePasswordDto,
  VerifyForgotPasswordOTPDto,
} from './dtos';
import { JwtUser } from './types';
import { Public, Roles } from './decorators';

import { User } from '../users/models';

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

  @Public()
  @UseGuards(RefreshThrottlerGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Exchange a valid refresh token for a new access token and refresh token pair',
  })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiUnauthorizedResponse({
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
  @ApiUnauthorizedResponse({
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
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { accountIdentifier, data } = registerDto;
    return this.authService.register(data, accountIdentifier);
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
  @ApiNotFoundResponse({
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
  @ApiOkResponse({
    description: 'Session analytics retrieved successfully',
  })
  @ApiForbiddenResponse({
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
  @ApiOkResponse({
    description: 'Suspicious activities retrieved successfully',
  })
  @ApiForbiddenResponse({
    description: 'User does not have required permissions',
  })
  async getSuspiciousActivities(@Param('userId') userId: string) {
    return this.authService.getSuspiciousActivities(userId);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP code' })
  @ApiOkResponse({ description: 'Email verified successfully' })
  @ApiUnprocessableEntityResponse({
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
  @ApiOkResponse({ description: 'Password reset initiated successfully' })
  async initiateForgotPassword(@Body() dto: InitiateForgotPasswordEmailDto) {
    return this.authService.initiateForgotPasswordForEmail(dto.email);
  }

  @Post('forgot-password/email/verify')
  @Public()
  @ApiOperation({ summary: 'Verify OTP code for forgot password' })
  @ApiOkResponse({ description: 'OTP verified successfully' })
  @ApiUnprocessableEntityResponse({ description: 'Invalid or expired OTP' })
  async verifyForgotPasswordOTP(@Body() dto: VerifyForgotPasswordOTPDto) {
    return this.authService.verifyForgotPasswordOTP(dto.email, dto.code);
  }

  @Post('forgot-password/email/reset')
  @Public()
  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiOkResponse({ description: 'Password reset successfully' })
  @ApiUnprocessableEntityResponse({ description: 'Invalid or expired OTP' })
  async resetPasswordWithOTP(@Body() dto: ResetPasswordWithOTPEmailDto) {
    return this.authService.resetPasswordWithEmail(dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({
    description: 'Current user profile',
    type: User,
  })
  async getProfile(@Req() req: Request) {
    const user = req.user as JwtUser;
    return this.authService.getProfile(user.userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiOkResponse({
    description: 'Profile updated successfully',
    type: User,
  })
  async updateProfile(@Req() req: Request, @Body() updateProfileDto: UpdateProfileDto) {
    const user = req.user as JwtUser;
    return this.authService.updateProfile(user.userId, updateProfileDto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiOkResponse({
    description: 'Password changed successfully',
  })
  async changePassword(@Req() req: Request, @Body() changePasswordDto: ChangePasswordDto) {
    const user = req.user as JwtUser;
    return this.authService.changePassword(user.userId, changePasswordDto);
  }

  // ============================================================
  // TEST ENDPOINTS - FOR PRESENTATION/DEMO ONLY
  // Remove or protect these in production!
  // ============================================================

  @Public()
  @Get('test/lockouts')
  @ApiOperation({
    summary: '[TEST] Get all lockout data',
    description:
      'Gets all failed login attempts and locked accounts for testing. DO NOT use in production!',
  })
  @ApiOkResponse({
    description: 'All lockout data retrieved',
  })
  async testGetAllLockouts() {
    return this.authService.testGetAllLockouts();
  }

  @Public()
  @Delete('test/lockouts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[TEST] Clear all lockout data',
    description:
      'Clears all failed login attempts and lockouts for testing. DO NOT use in production!',
  })
  @ApiOkResponse({
    description: 'All lockouts cleared successfully',
  })
  async testClearAllLockouts() {
    return this.authService.testClearAllLockouts();
  }

  @Public()
  @Get('test/expired-token')
  @ApiOperation({
    summary: '[TEST] Generate an expired access token',
    description:
      'Generates an immediately expired access token for testing expired token scenarios. Uses the first user in the database. DO NOT use in production!',
  })
  @ApiOkResponse({
    description: 'Expired token generated successfully',
  })
  async testGenerateExpiredToken() {
    return this.authService.testGenerateExpiredToken();
  }
}
