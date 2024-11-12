import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, Get, Req, Ip, Headers, Param, Query } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { LoginThrottlerGuard } from './guards/login-throttler.guard';

import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dtos';
import { JwtUser } from './types';
import { Public, Roles } from './decorators';

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
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    const user = req.user as JwtUser;
    await this.authService.revokeRefreshToken(user.userId);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin')
  getAdminProfile() {
    return 'Admin profile';
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @Get('staff')
  getStaffProfile() {
    return 'Staff profile';
  }

  @Get('sessions')
  async getActiveSessions(@Req() req: Request) {
    const user = req.user as JwtUser;
    // Get current session ID from token if needed
    return this.authService.getUserActiveSessions(user.userId);
  }

  @Post('sessions/:sessionId/revoke')
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @Req() req: Request
  ) {
    const user = req.user as JwtUser;
    await this.authService.revokeRefreshToken(user.userId, sessionId);
    return { message: 'Session revoked successfully' };
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('sessions/analytics')
  async getSessionAnalytics(@Query('userId') userId?: string) {
    return this.authService.getSessionAnalytics(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users/:userId/suspicious-activities')
  async getSuspiciousActivities(@Param('userId') userId: string) {
    return this.authService.getSuspiciousActivities(userId);
  }
}
