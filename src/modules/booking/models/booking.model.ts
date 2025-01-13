import { HotelRoom } from '@/modules/room/models';
import { User } from '@/modules/users/models';
import { ApiProperty } from '@nestjs/swagger';
import {
  BookingCreateType,
  BookingStatus,
  BookingType,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import Decimal from 'decimal.js';
import { AbstractModel } from 'libs/common';
import { GuestDetail } from './guest-detail.model';

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
    type: () => HotelRoom,
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
    type: () => User,
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

  @ApiProperty({
    type: String,
    example: '1000000',
    description: 'Number of adults',
  })
  total_amount: Decimal;

  @ApiProperty({
    type: String,
    enum: BookingStatus,
    example: BookingStatus.PENDING,
    description: 'Booking status',
  })
  status: BookingStatus;

  @ApiProperty({
    type: String,
    example: 'Have something else to do',
    description: 'Reason for canceling the booking',
  })
  cancel_reason?: string;

  @ApiProperty({
    type: String,
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
    description: 'Payment method',
  })
  payment_method: PaymentMethod;

  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Number of guests',
  })
  number_of_guests: number;

  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Number of adults',
  })
  adults: number;

  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Number of children',
  })
  children: number;

  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Number of infants',
  })
  infants: number;

  @ApiProperty({
    type: String,
    example: 'Special requirements',
    description: 'Special requirements',
  })
  special_requests: string;

  @ApiProperty({
    type: Date,
    example: 'Check in time',
    description: 'Check in time',
  })
  check_in_time: Date;

  @ApiProperty({
    type: Date,
    example: 'Check out time',
    description: 'Check out time',
  })
  check_out_time: Date;

  @ApiProperty({
    type: String,
    enum: PaymentStatus,
    example: PaymentStatus.UNPAID,
    description: 'Payment status',
  })
  payment_status: PaymentStatus;

  @ApiProperty({
    type: Object,
    example: 'Payment details',
    description: 'Payment details',
  })
  payment_details: any;

  @ApiProperty({
    type: GuestDetail,
    description: 'Guest details',
  })
  guest_details?: GuestDetail;

  @ApiProperty({
    type: String,
    example: 'Promotion code',
    description: 'Promotion code',
  })
  promotion_code?: string;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Is business trip',
  })
  is_business_trip: boolean;
}
