import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { DatabaseModule } from '@/database/database.module';
import { RoomDetailModule } from '@/modules/room-detail/room-detail.module';
import { RoomModule } from '@/modules/room/room.module';

@Module({
  imports: [DatabaseModule, RoomDetailModule, RoomModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
