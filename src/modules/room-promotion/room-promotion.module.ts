import { Module } from '@nestjs/common';
import { RoomPromotionService } from './room-promotion.service';
import { RoomPromotionController } from './room-promotion.controller';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RoomPromotionController],
  providers: [RoomPromotionService],
  exports: [RoomPromotionService],
})
export class RoomPromotionModule {}
