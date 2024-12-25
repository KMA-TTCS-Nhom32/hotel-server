import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@/database/database.service';
import { getCleanupConfig } from '@/config/cleanup.config';
import { CronJob } from 'cron';

@Injectable()
export class CleanupService implements OnModuleInit {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  private readonly logger = new Logger(CleanupService.name);
  private readonly config = getCleanupConfig(this.configService);

  onModuleInit() {
    const job = new CronJob(this.config.scheduleTime, () => {
      this.cleanupSoftDeletedRecords();
    });

    this.schedulerRegistry.addCronJob('cleanup-job', job);

    if (this.config.enabled) {
      job.start();
      this.logger.log(`Cleanup job scheduled with pattern: ${this.config.scheduleTime}`);
    } else {
      this.logger.log('Cleanup job is disabled');
    }
  }

  private async cleanupSoftDeletedRecords() {
    if (!this.config.enabled) {
      this.logger.log('Cleanup service is disabled');
      return;
    }

    this.logger.log('Starting cleanup of soft-deleted records...');
    const cutoffDate = new Date(Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000);

    try {
      const deletePromises = this.config.models.map((model) =>
        this.databaseService[model].deleteMany({
          where: {
            isDeleted: true,
            deletedAt: { lt: cutoffDate },
          },
        }),
      );

      const results = await Promise.all(deletePromises);

      const summary = results.reduce((acc, result, index) => {
        acc[this.config.models[index]] = result.count;
        return acc;
      }, {});

      this.logger.log('Cleanup completed. Results:', summary);
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
    }
  }
}
