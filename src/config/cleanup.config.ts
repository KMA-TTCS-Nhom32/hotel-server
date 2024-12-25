import { CleanupConfig } from '@/common/types';
import { ConfigService } from '@nestjs/config';
import { CronExpression } from '@nestjs/schedule';

export const getCleanupConfig = (configService: ConfigService): CleanupConfig => {
  const isProduction = configService.get('NODE_ENV') === 'production';

  return {
    retentionPeriod: configService.get<number>('CLEANUP_RETENTION_PERIOD', 30),
    models: ['province', 'hotelBranch'],
    scheduleTime: isProduction 
      ? CronExpression.EVERY_DAY_AT_MIDNIGHT 
      : CronExpression.EVERY_30_SECONDS,
    batchSize: configService.get<number>('CLEANUP_BATCH_SIZE', 100),
    enabled: configService.get<boolean>('ENABLE_AUTO_CLEANUP', false),
    safetyChecks: {
      preventDeleteWithActiveBookings: true,
      preventDeleteWithActiveRooms: true,
      preventDeleteWithActiveBranches: true,
    },
  };
};