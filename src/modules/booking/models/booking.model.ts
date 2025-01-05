import { HotelRoom } from '@/modules/room/models';
import { User } from '@/modules/users/models';
import { ApiProperty } from '@nestjs/swagger';
import { BookingCreateType, BookingType } from '@prisma/client';
import { AbstractModel } from 'libs/common';

export class Booking extends AbstractModel {
  constructor(data: Partial<Booking>) {
    super();
    Object.assign(this, data);
  }

  @ApiProperty({
    type: String,
    example: 'SAMPLECODE1',
    description: 'Booking code',
  })
  code: string;

  @ApiProperty({
    type: String,
    enum: BookingType,
    example: BookingType.HOURLY,
    description: 'Type of booking',
  })
  type: BookingType;

  @ApiProperty({
    type: String,
    enum: BookingCreateType,
    example: BookingCreateType.ONLINE_BOOKING,
    description: 'Type of booking',
  })
  create_type: BookingCreateType;

  @ApiProperty({
    type: String,
    example: 'room-id-123',
    description: 'ID of the room being booked',
  })
  roomId: string;

  @ApiProperty({
    type: HotelRoom,
    description: 'Room being booked',
  })
  room?: HotelRoom;

  @ApiProperty({
    type: String,
    example: 'user-id-123',
    description: 'ID of the user making the booking',
  })
  userId: string;

  @ApiProperty({
    type: User,
    description: 'User making the booking',
  })
  user?: User;

  @ApiProperty({
    type: Date,
    example: new Date(),
    description: 'Booking start date',
  })
  start_date: Date;

  @ApiProperty({
    type: Date,
    example: new Date(),
    description: 'Booking end date',
  })
  end_date: Date;

  @ApiProperty({
    type: String,
    example: '08:00',
    description: 'Booking start time',
  })
  start_time: string;

  @ApiProperty({
    type: String,
    example: '10:00',
    description: 'Booking end time',
  })
  end_time: string;
}
