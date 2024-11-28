import { Process, Processor, OnQueueError, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from './email.service';
import { VerificationEmailDto } from './dtos';

@Processor('email-queue')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  @Process({
    name: 'verification-email',
    concurrency: 1, // Process one job at a time
  })
  async handleVerificationEmail(job: Job<VerificationEmailDto>) {
    this.logger.debug(`Processing verification email job ${job.id} for ${job.data.to}`);

    const result = await this.emailService.sendVerificationEmail(job.data);

    if (!result) {
      this.logger.error(`Failed to send verification email for job ${job.id}`);
      throw new Error('Failed to send verification email');
    }

    this.logger.debug(`Successfully processed verification email job ${job.id}`);
    return result;
  }

  @OnQueueError()
  onError(error: Error) {
    this.logger.error(`Queue error: ${error.message}`, error.stack);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Failed job ${job.id} of type ${job.name}: ${error.message}`, error.stack);
  }
}
