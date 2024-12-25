import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { CleanupService } from '../services/cleanup.service';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [DatabaseModule, ConfigModule, ScheduleModule.forRoot()],
  providers: [
    SchedulerRegistry, // Add this line to provide SchedulerRegistry
    CleanupService,
  ],
  exports: [CleanupService],
})
export class CleanupModule {}
