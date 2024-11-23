import { ConfigService } from '@nestjs/config';
import { BullModuleOptions } from '@nestjs/bull';

export const getBullConfig = (configService: ConfigService): BullModuleOptions => {
  const isProduction = true;

  return {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
    redis: {
      host: isProduction ? configService.get('REDIS_PROD_HOST') : configService.get('REDIS_HOST'),
      port: isProduction ? parseInt(configService.get('REDIS_PROD_PORT')) : parseInt(configService.get('REDIS_PORT')),
      password: isProduction ? configService.get('REDIS_PROD_PASSWORD') : undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    }
  };
};
