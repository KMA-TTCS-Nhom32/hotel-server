import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { EmailService } from './email.service';
import { RegisterVerificationEmailDto } from './dtos';

@ApiTags('Email')
@Controller('email')
@UseGuards(ThrottlerGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send-verification')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } }) // 3 requests per minute
  @ApiOperation({ summary: 'Send verification email' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async sendVerificationEmail(@Body() verificationDto: RegisterVerificationEmailDto) {
    const result = await this.emailService.queueVerificationEmail(verificationDto);
    return {
      success: result,
      message: result ? 'Email queued successfully' : 'Failed to queue email',
    };
  }
}
