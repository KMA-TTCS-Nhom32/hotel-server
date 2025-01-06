import { BookingStatus, PaymentStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateBookingPaymentDto {
  @ApiProperty({
    type: String,
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
    description: 'Payment status',
  })
  @IsNotEmpty()
  @IsEnum(PaymentStatus)
  payment_status: PaymentStatus;

  @ApiPropertyOptional({
    type: String,
    enum: BookingStatus,
    example: BookingStatus.COMPLETED,
    description: 'Booking status',
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  booking_status?: BookingStatus;

  @ApiPropertyOptional({
    type: Object,
    example: 'Payment details',
    description: 'Payment details',
  })
  @IsOptional()
  payment_details?: any;
}

export class UpdateBookingRefundDto {
  @ApiPropertyOptional({
    type: Object,
    example: 'Refund details',
    description: 'Refund details',
  })
  @IsNotEmpty()
  payment_details: any;
}
