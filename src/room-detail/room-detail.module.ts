import { Module } from '@nestjs/common';
import { RoomDetailService } from './room-detail.service';
import { RoomDetailController } from './room-detail.controller';

@Module({
  controllers: [RoomDetailController],
  providers: [RoomDetailService],
})
export class RoomDetailModule {}
