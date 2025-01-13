import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { DatabaseModule } from '@/database/database.module';
import { RoomDetailModule } from '@/modules/room-detail/room-detail.module';

@Module({
  imports: [DatabaseModule, RoomDetailModule],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomModule {}
