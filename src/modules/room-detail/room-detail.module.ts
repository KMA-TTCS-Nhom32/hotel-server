import { Module } from '@nestjs/common';
import { RoomDetailService } from './room-detail.service';
import { RoomDetailController } from './room-detail.controller';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RoomDetailController],
  providers: [RoomDetailService],
  exports: [RoomDetailService],
})
export class RoomDetailModule {}
