import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { VerifyCodeDto, VerifyCodeResponseDto, VerifyEmailOTP } from './dto';
import { Public } from '../auth/decorators';

@ApiTags('Verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Code verified successfully',
    type: VerifyCodeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Invalid or expired verification code',
  })
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.verificationService.verifyCode(
      verifyCodeDto.userId,
      verifyCodeDto.code,
      verifyCodeDto.type,
    );
  }

  @Public()
  @Post('verify-email-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an email OTP' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email OTP verified successfully',
    type: VerifyCodeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Invalid or expired verification code',
  })
  async verifyEmailOTP(@Body() verifyCodeDto: VerifyEmailOTP) {
    const { email, code } = verifyCodeDto;

    return this.verificationService.verifyEmailCode(email, code);
  }
}
