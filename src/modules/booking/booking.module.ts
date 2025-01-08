import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { DatabaseModule } from '@/database/database.module';
import { RoomDetailModule } from '@/modules/room-detail/room-detail.module';

@Module({
  imports: [DatabaseModule, RoomDetailModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
