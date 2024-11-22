import { ConfigService } from '@nestjs/config';
import { BullModuleOptions } from '@nestjs/bull';

export const getBullConfig = (configService: ConfigService): BullModuleOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';

  return {
    redis: {
      host: isProduction ? configService.get('REDIS_PROD_HOST') : configService.get('REDIS_HOST'),
      port: isProduction
        ? parseInt(configService.get('REDIS_PROD_PORT'))
        : parseInt(configService.get('REDIS_PORT')),
      password: isProduction ? configService.get('REDIS_PROD_PASSWORD') : undefined,
      tls: isProduction && configService.get('REDIS_PROD_TLS') === 'true' ? {} : undefined,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      retryStrategy(times: number) {
        return Math.min(times * 50, 2000);
      },
    },
  };
};
