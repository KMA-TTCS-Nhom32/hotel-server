import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HotelRoomType } from '@prisma/client';

export class RevenueByRoomTypeDto {
  @ApiProperty({
    enum: HotelRoomType,
    example: HotelRoomType.DELUXE,
  })
  roomType: HotelRoomType;

  @ApiProperty({
    example: 35000000,
  })
  revenue: number;

  @ApiProperty({
    example: 45,
  })
  bookingsCount: number;

  @ApiProperty({
    example: 25.5,
  })
  percentageOfTotal: number;
}

export class RevenueTimelineDto {
  @ApiProperty({
    example: {
      "2024-01": 45000000,
      "2024-02": 52000000,
      "2024-03": 48000000,
    }
  })
  monthlyRevenue: Record<string, number>;

  @ApiProperty({
    type: [RevenueByRoomTypeDto],
  })
  byRoomType: RevenueByRoomTypeDto[];

  @ApiProperty({
    example: 145000000,
  })
  totalRevenue: number;
}

export class RoomPerformanceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({
    enum: HotelRoomType,
  })
  room_type: HotelRoomType;

  @ApiProperty()
  bookings_count: number;

  @ApiProperty()
  total_revenue: number;

  @ApiProperty()
  average_occupancy: number;

  @ApiProperty()
  cancellation_rate: number;
}

export class AnalyticsSummaryDto {
  @ApiProperty({
    type: RevenueTimelineDto,
  })
  revenue: RevenueTimelineDto;

  @ApiProperty({
    example: 75.5,
    description: 'Average occupancy rate percentage',
  })
  occupancyRate: number;

  @ApiProperty({
    example: 12.3,
    description: 'Overall cancellation rate percentage',
  })
  cancellationRate: number;

  @ApiProperty({
    type: [RoomPerformanceDto],
    description: 'Performance metrics by room type',
  })
  roomPerformance: RoomPerformanceDto[];

  @ApiPropertyOptional({
    example: {
      totalBookings: 156,
      completedBookings: 142,
      cancelledBookings: 14,
      averageStayDuration: 2.5
    },
    description: 'Additional booking statistics',
  })
  bookingStats: {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    averageStayDuration: number;
  } | undefined;
}

export class OccupancyRateResponseDto {
  @ApiProperty({
    example: 75.5,
  })
  rate: number;

  @ApiProperty({
    example: 100,
  })
  totalRooms: number;

  @ApiProperty({
    example: 75,
  })
  occupiedRooms: number;

  @ApiProperty({
    example: {
      STANDARD: 80.5,
      SUPERIOR: 70.2,
      DELUXE: 75.8
    }
  })
  byRoomType: Record<HotelRoomType, number>;
}
