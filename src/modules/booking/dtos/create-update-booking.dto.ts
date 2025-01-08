import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { BookingCreateType, BookingStatus, BookingType, PaymentMethod } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { GuestDetail } from '../models';
import { Type } from 'class-transformer';

export class PrepareBookingDto {
  @ApiProperty({
    type: String,
    enum: BookingCreateType,
    example: BookingCreateType.ONLINE_BOOKING,
    description: 'Booking create type',
  })
  @IsNotEmpty()
  @IsEnum(BookingCreateType)
  create_type: BookingCreateType;

  @ApiProperty({
    type: String,
    enum: BookingType,
    example: BookingType.HOURLY,
    description: 'Booking code',
  })
  @IsNotEmpty()
  @IsEnum(BookingType)
  type: BookingType;

  @ApiProperty({
    type: String,
    example: 'user-id-123',
    description: 'ID of the user making the booking',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;
}

export class CreateBookingDto {
  @ApiProperty({
    type: String,
    example: '20-01-2025',
    description: 'Start date of the booking',
  })
  @IsNotEmpty()
  @IsDateString()
  start_date: string;

  @ApiProperty({
    type: String,
    example: '20-01-2025',
    description: 'End date of the booking',
  })
  @IsNotEmpty()
  @IsDateString()
  end_date: string;

  @ApiProperty({
    type: String,
    example: '08:00',
    description: 'Start time of the booking',
  })
  @IsNotEmpty()
  @IsString()
  start_time: string;

  @ApiProperty({
    type: String,
    example: '10:00',
    description: 'End time of the booking',
  })
  @IsNotEmpty()
  @IsString()
  end_time: string;

  @ApiProperty({
    type: Number,
    example: 10,
    description: 'Number of guests',
  })
  @IsNotEmpty()
  @IsNumber()
  number_of_guests: number;

  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Number of adults',
  })
  @IsNotEmpty()
  @IsNumber()
  adults: number;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Number of children',
  })
  @IsNotEmpty()
  @IsNumber()
  children: number;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Number of infants',
  })
  @IsNotEmpty()
  @IsNumber()
  infants: number;

  @ApiPropertyOptional({
    type: String,
    example: 'Special requirements',
    description: 'Special requirements',
  })
  @IsOptional()
  @IsString()
  special_requests?: string;

  @ApiPropertyOptional({
    type: GuestDetail,
    description: 'Guest details',
  })
  @IsOptional()
  @Type(() => GuestDetail)
  guest_details?: GuestDetail;
}

export class CreateBookingOnlineDto extends CreateBookingDto {
  @ApiProperty({
    type: String,
    example: 'detail-id-123',
    description: 'ID of the room detail being booked',
  })
  @IsNotEmpty()
  @IsString()
  detailId: string;

  @ApiPropertyOptional({
    type: String,
    example: 'SAMPLECODE',
    description: 'Promotion code',
  })
  @IsOptional()
  @IsString()
  promotion_code?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.VIET_QR,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Is this booking a business trip?',
  })
  @IsOptional()
  @IsBoolean()
  is_business_trip?: boolean;
}

export class CreateBookingAtHotelDto extends CreateBookingDto {
  @ApiProperty({
    type: String,
    example: 'room-id-123',
    description: 'ID of the room being booked',
  })
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @ApiProperty({
    type: String,
    example: '20-01-2025T22:00:00Z',
    description: 'Check in time',
  })
  @IsNotEmpty()
  @IsDateString()
  check_in_time: string;
}

export class UpdateBookingDto extends PartialType(CreateBookingDto) {
  @ApiPropertyOptional({
    type: String,
    example: 'room-id-123',
    description: 'ID of the room being changed to',
  })
  @IsOptional()
  roomId?: string;

  @ApiPropertyOptional({
    type: String,
    example: '20-01-2025T08:00:00Z',
    description: 'Check in time',
  })
  @IsOptional()
  check_in_time?: string;

  @ApiPropertyOptional({
    type: String,
    example: '20-01-2025T10:00:00Z',
    description: 'Check out time',
  })
  @IsOptional()
  check_out_time?: string;

  @ApiPropertyOptional({
    type: String,
    enum: PaymentMethod,
    example: PaymentMethod.BANKING,
    description: 'Payment method',
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;
}

export class UpdateBookingStatusDto {
  @ApiProperty({
    type: String,
    enum: BookingStatus,
    example: BookingStatus.COMPLETED,
    description: 'Booking status',
  })
  @IsNotEmpty()
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
