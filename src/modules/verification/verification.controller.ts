import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { 
  ApiOperation, 
  ApiTags,
  ApiOkResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse 
} from '@nestjs/swagger';
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
  @ApiOkResponse({
    description: 'Code verified successfully',
    type: VerifyCodeResponseDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid or expired verification code',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
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
  @ApiOkResponse({
    description: 'Email OTP verified successfully',
    type: VerifyCodeResponseDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid or expired verification code',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async verifyEmailOTP(@Body() verifyCodeDto: VerifyEmailOTP) {
    const { email, code } = verifyCodeDto;

    return this.verificationService.verifyEmailCode(email, code);
  }
}
