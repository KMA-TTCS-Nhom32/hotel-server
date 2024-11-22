import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from './email.service';
import { RegisterVerificationEmailDto } from './dtos';

@Processor('email-queue')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  @Process('verification-email')
  async handleVerificationEmail(job: Job<RegisterVerificationEmailDto>) {
    this.logger.debug('Start processing verification email job...');
    try {
      await this.emailService.sendRegisterVerificationEmail(job.data);
      this.logger.debug('Verification email sent successfully');
    } catch (error) {
      this.logger.error('Failed to process verification email job', error);
      throw error;
    }
  }
}
