import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { BullModule } from '@nestjs/bull';
import { EmailProcessor } from './email.processor';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-queue',
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
      // Remove Redis config from here since it's handled in bull.config.ts
    }),
    ThrottlerModule.forRoot([
      {
        name: 'email',
        ttl: 60000,
        limit: 3,
      },
    ]),
  ],
  controllers: [EmailController],
  providers: [EmailService, ConfigService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}
