import { ApiProperty } from '@nestjs/swagger';
import { HotelRoomType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { RevenueByRoomTypeDto } from './analytics-response.dto';

export class RevenueMetricsDto {
  @ApiProperty({
    example: 1000000,
    description: 'Total revenue',
  })
  @IsNumber()
  total: number;

  @ApiProperty({
    example: {
      '2024-01': 450000,
      '2024-02': 550000,
    },
    description: 'Monthly revenue breakdown',
  })
  @IsObject()
  monthlyRevenue: Record<string, number>;

  @ApiProperty({
    type: [RevenueByRoomTypeDto],
    description: 'Revenue breakdown by room type',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RevenueByRoomTypeDto)
  byRoomType: RevenueByRoomTypeDto[];
}

export class RoomMetricsDto {
  @ApiProperty()
  @IsNumber()
  bookings_count: number;

  @ApiProperty()
  @IsNumber()
  total_revenue: number;

  @ApiProperty()
  @IsNumber()
  average_occupancy: number;

  @ApiProperty()
  @IsNumber()
  cancellation_rate: number;

  @ApiProperty({
    enum: HotelRoomType,
  })
  @IsEnum(HotelRoomType)
  room_type: HotelRoomType;
}

export class BookingStatsMetricsDto {
  @ApiProperty({
    example: 156,
  })
  @IsNumber()
  totalBookings: number;

  @ApiProperty({
    example: 142,
  })
  @IsNumber()
  completedBookings: number;

  @ApiProperty({
    example: 14,
  })
  @IsNumber()
  cancelledBookings: number;

  @ApiProperty({
    example: 2.5,
  })
  @IsNumber()
  averageStayDuration: number;
}

export class AnalyticsMetricsDto {
  @ApiProperty({
    type: RevenueMetricsDto,
  })
  @ValidateNested()
  @Type(() => RevenueMetricsDto)
  revenue: RevenueMetricsDto;

  @ApiProperty({
    example: 75.5,
  })
  @IsNumber()
  occupancyRate: number;

  @ApiProperty({
    example: 12.3,
  })
  @IsNumber()
  cancellationRate: number;

  @ApiProperty({
    type: [RoomMetricsDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomMetricsDto)
  roomPerformance: RoomMetricsDto[];

  @ApiProperty({
    type: BookingStatsMetricsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BookingStatsMetricsDto)
  bookingStats?: BookingStatsMetricsDto;
}
