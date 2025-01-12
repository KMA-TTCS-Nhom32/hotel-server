import { Module } from '@nestjs/common';
import { RoomPriceHistoryService } from './room-price-history.service';
import { RoomPriceHistoryController } from './room-price-history.controller';
import { DatabaseModule } from '@/database/database.module';
import { PriceUpdateCronService } from './cron/price-update.cron';

@Module({
  imports: [DatabaseModule],
  controllers: [RoomPriceHistoryController],
  providers: [RoomPriceHistoryService, PriceUpdateCronService],
  exports: [RoomPriceHistoryService],
})
export class RoomPriceHistoryModule {}
