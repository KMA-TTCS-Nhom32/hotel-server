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
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from './guards/roles.guard';
import { AccountIdentifier, UserRole } from '@prisma/client';
import { Request } from 'express';

import { LoginThrottlerGuard } from './guards/login-throttler.guard';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto, VerifyEmailDto } from './dtos';
import { JwtUser } from './types';
import { Public, Roles } from './decorators';

import { User } from '../users/models';
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

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: User,
  })
  async register(
    @Body() createUserDto: CreateUserDto,
    @Body('accountIdentifier') accountIdentifier: AccountIdentifier = AccountIdentifier.EMAIL,
  ) {
    return this.authService.register(createUserDto, accountIdentifier);
  }

  @Get('sessions')
  async getActiveSessions(@Req() req: Request) {
    const user = req.user as JwtUser;
    // Get current session ID from token if needed
    return this.authService.getUserActiveSessions(user.userId);
  }

  @Post('sessions/:sessionId/revoke')
  @HttpCode(HttpStatus.OK)
  async revokeSession(@Param('sessionId') sessionId: string, @Req() req: Request) {
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

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP code' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Email verified successfully' })
  @ApiResponse({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: 'Invalid verification code' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyOTPAndUpdateUser(
      verifyEmailDto.userId,
      verifyEmailDto.code,
      AccountIdentifier.EMAIL,
    );
  }
}
