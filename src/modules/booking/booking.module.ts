import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { DatabaseModule } from '@/database/database.module';
import { RoomDetailModule } from '@/modules/room-detail/room-detail.module';
import { RoomModule } from '@/modules/room/room.module';
import { GatewayModule } from '@/gateway/gateway.module';

@Module({
  imports: [DatabaseModule, RoomDetailModule, RoomModule, GatewayModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
