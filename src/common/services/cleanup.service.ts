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

  private readonly modelDependencyOrder = [
    'booking',       // Delete bookings first
    'review',        // Then reviews
    'hotelRoom',     // Then rooms
    'roomDetail',    // Then room details
    'hotelBranch',   // Then branches
    'province',      // Finally provinces
  ];

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
      // Use transaction to ensure all-or-nothing deletion
      await this.databaseService.$transaction(async (prisma) => {
        const results = {};

        // Delete in order of dependencies
        for (const model of this.modelDependencyOrder) {
          // Apply safety checks based on configuration
          if (this.config.safetyChecks.preventDeleteWithActiveBookings && model === 'hotelRoom') {
            const deleteResult = await prisma[model].deleteMany({
              where: {
                isDeleted: true,
                deletedAt: { lt: cutoffDate },
                bookings: { none: { status: { in: ['PENDING', 'CHECKED_IN'] } } }
              },
            });
            results[model] = deleteResult.count;
          }
          else if (this.config.safetyChecks.preventDeleteWithActiveRooms && model === 'hotelBranch') {
            const deleteResult = await prisma[model].deleteMany({
              where: {
                isDeleted: true,
                deletedAt: { lt: cutoffDate },
                rooms: { none: { isDeleted: false } }
              },
            });
            results[model] = deleteResult.count;
          }
          else if (this.config.safetyChecks.preventDeleteWithActiveBranches && model === 'province') {
            const deleteResult = await prisma[model].deleteMany({
              where: {
                isDeleted: true,
                deletedAt: { lt: cutoffDate },
                branches: { none: { isDeleted: false } }
              },
            });
            results[model] = deleteResult.count;
          }
          else {
            // Default deletion without safety checks for other models
            const deleteResult = await prisma[model].deleteMany({
              where: {
                isDeleted: true,
                deletedAt: { lt: cutoffDate },
              },
            });
            results[model] = deleteResult.count;
          }

          this.logger.log(`Cleaned up ${results[model]} ${model} records`);
        }

        return results;
      });

      this.logger.log('Cleanup completed successfully');
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
    }
  }
}
