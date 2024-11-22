import { Controller, Post, Body } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerifyCodeDto } from './dto';
import { Public } from '../auth/decorators';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Public()
  @Post('verify')
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.verificationService.verifyCode(
      verifyCodeDto.userId,
      verifyCodeDto.code,
      verifyCodeDto.type,
    );
  }
}
