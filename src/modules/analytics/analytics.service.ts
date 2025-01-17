import { DatabaseService } from '@/database/database.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingStatus, PaymentStatus, AnalyticsPeriodType, HotelRoomType } from '@prisma/client';
import dayjs from '@/config/dayjs';  // Updated import
import {
  AnalyticsSummaryDto,
  OccupancyRateResponseDto,
  RevenueTimelineDto,
  RoomPerformanceDto,
} from './dtos';

@Injectable()
export class AnalyticsService {
  constructor(private readonly databaseService: DatabaseService) {}

  private aggregateRevenueByRoomType(bookings: any[]) {
    return bookings.reduce((acc, booking) => {
      const roomType = booking.room.detail.room_type;
      acc[roomType] = (acc[roomType] || 0) + Number(booking.total_amount);
      return acc;
    }, {});
  }

  async getOccupancyRate(
    branchId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<OccupancyRateResponseDto> {
    const totalRooms = await this.databaseService.hotelRoom.count({
      where: { detail: { branchId } },
    });

    const roomTypeOccupancy = await this.databaseService.roomDetail.findMany({
      where: { branchId },
      select: {
        room_type: true,
        flat_rooms: {
          select: {
            bookings: {
              where: {
                status: { in: [BookingStatus.CHECKED_IN, BookingStatus.COMPLETED] },
                start_date: { gte: startDate },
                end_date: { lte: endDate },
              },
            },
          },
        },
      },
    });

    const occupiedRooms = roomTypeOccupancy.reduce(
      (sum, room) => sum + room.flat_rooms.reduce((acc, fr) => acc + fr.bookings.length, 0),
      0,
    );

    const byRoomType = roomTypeOccupancy.reduce(
      (acc, room) => {
        const occupiedCount = room.flat_rooms.reduce((sum, fr) => sum + fr.bookings.length, 0);
        const roomCount = room.flat_rooms.length;
        acc[room.room_type] = roomCount > 0 ? (occupiedCount / roomCount) * 100 : 0;
        return acc;
      },
      {} as Record<HotelRoomType, number>,
    );

    return {
      rate: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0,
      totalRooms,
      occupiedRooms,
      byRoomType,
    };
  }

  async getMonthlyRevenue(branchId: string, month: Date) {
    const startDate = dayjs(month).startOf('month').toDate();
    const endDate = dayjs(month).endOf('month').toDate();

    const bookings = await this.databaseService.booking.findMany({
      where: {
        room: { detail: { branchId } },
        payment_status: PaymentStatus.PAID,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        total_amount: true,
        room: {
          select: {
            detail: {
              select: {
                name: true,
                room_type: true,
              },
            },
          },
        },
      },
    });

    return {
      total: bookings.reduce((sum, booking) => sum + Number(booking.total_amount), 0),
      byRoomType: this.aggregateRevenueByRoomType(bookings),
    };
  }

  async getRevenueTimeline(branchId: string, months: number): Promise<RevenueTimelineDto> {
    const endDate = dayjs().toDate();
    const startDate = dayjs().subtract(months, 'month').toDate();

    const bookings = await this.databaseService.booking.findMany({
      where: {
        room: { detail: { branchId } },
        payment_status: PaymentStatus.PAID,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        total_amount: true,
        createdAt: true,
        room: {
          select: {
            detail: {
              select: {
                room_type: true,
              },
            },
          },
        },
      },
    });

    const monthlyRevenue = this.aggregateRevenueByMonth(bookings, months);
    const totalRevenue = Object.values(monthlyRevenue).reduce((sum, val) => sum + val, 0);
    const byRoomType = this.calculateRevenueByRoomType(bookings, totalRevenue);

    return {
      monthlyRevenue,
      byRoomType,
      totalRevenue,
    };
  }

  private calculateRevenueByRoomType(bookings: any[], totalRevenue: number) {
    const revenueByType = bookings.reduce((acc, booking) => {
      const roomType = booking.room.detail.room_type;
      if (!acc[roomType]) {
        acc[roomType] = {
          roomType,
          revenue: 0,
          bookingsCount: 0,
          percentageOfTotal: 0,
        };
      }
      acc[roomType].revenue += Number(booking.total_amount);
      acc[roomType].bookingsCount++;
      return acc;
    }, {}) as Record<
      HotelRoomType,
      { roomType: HotelRoomType; revenue: number; bookingsCount: number }
    >;

    return Object.values(revenueByType).map((type) => ({
      ...type,
      percentageOfTotal: totalRevenue > 0 ? (type.revenue / totalRevenue) * 100 : 0,
    }));
  }

  async getRoomTypePerformance(
    branchId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<RoomPerformanceDto[]> {
    const rooms = await this.databaseService.roomDetail.findMany({
      where: { branchId },
      select: {
        id: true,
        name: true,
        room_type: true,
        flat_rooms: {
          select: {
            bookings: {
              where: {
                createdAt: { gte: startDate, lte: endDate },
              },
              select: {
                total_amount: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return rooms.map((room) => {
      const bookings = room.flat_rooms.flatMap((fr) => fr.bookings);
      const totalBookings = bookings.length;
      const cancelledBookings = bookings.filter((b) => b.status === BookingStatus.CANCELLED).length;
      const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_amount), 0);

      return {
        id: room.id,
        name: room.name,
        room_type: room.room_type,
        bookings_count: totalBookings,
        total_revenue: totalRevenue,
        average_occupancy: (totalBookings / (dayjs(endDate).diff(startDate, 'days') + 1)) * 100,
        cancellation_rate: totalBookings ? (cancelledBookings / totalBookings) * 100 : 0,
      };
    });
  }

  async getCancellationRate(branchId: string, startDate: Date, endDate: Date) {
    const totalBookings = await this.databaseService.booking.count({
      where: {
        room: { detail: { branchId } },
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const cancelledBookings = await this.databaseService.booking.count({
      where: {
        room: { detail: { branchId } },
        status: BookingStatus.CANCELLED,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    return totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
  }

  // Rename to make purpose clearer
  private async aggregateMonthlyAnalytics(month: Date) {
    const branches = await this.databaseService.hotelBranch.findMany();

    for (const branch of branches) {
      const metrics = {
        revenue: await this.getMonthlyRevenue(branch.id, month),
        occupancyRate: await this.getOccupancyRate(
          branch.id,
          dayjs(month).startOf('month').toDate(),
          dayjs(month).endOf('month').toDate(),
        ),
        cancellationRate: await this.getCancellationRate(
          branch.id,
          dayjs(month).startOf('month').toDate(),
          dayjs(month).endOf('month').toDate(),
        ),
        roomPerformance: await this.getRoomTypePerformance(
          branch.id,
          dayjs(month).startOf('month').toDate(),
          dayjs(month).endOf('month').toDate(),
        ),
      };

      // Convert metrics to JSON-serializable object and cache the monthly summary
      const metricsJson = JSON.parse(JSON.stringify(metrics));
      await this.databaseService.analyticsSummary.upsert({
        where: {
          branchId_period_period_type: {
            branchId: branch.id,
            period: dayjs(month).startOf('month').toDate(),
            period_type: AnalyticsPeriodType.MONTHLY,
          },
        },
        update: { metrics: metricsJson },
        create: {
          branchId: branch.id,
          period: dayjs(month).startOf('month').toDate(),
          period_type: AnalyticsPeriodType.MONTHLY,
          metrics: metricsJson,
        },
      });
    }
  }

  async getAnalyticsSummary(
    branchId: string,
    startDate: Date,
    endDate: Date,
    periodType: AnalyticsPeriodType = AnalyticsPeriodType.MONTHLY,
  ): Promise<AnalyticsSummaryDto> {
    // First try to get from cache
    const cachedAnalytics = await this.databaseService.analyticsSummary.findUnique({
      where: {
        branchId_period_period_type: {
          branchId,
          period: dayjs(startDate).startOf('month').toDate(),
          period_type: periodType,
        },
      },
    });

    if (cachedAnalytics && dayjs(cachedAnalytics.updatedAt).isAfter(dayjs().subtract(1, 'day'))) {
      return cachedAnalytics.metrics as unknown as AnalyticsSummaryDto;
    }

    // If not cached or outdated, calculate fresh
    const [revenue, occupancyRate, cancellationRate, roomPerformance, bookingStats] =
      await Promise.all([
        this.getRevenueTimeline(branchId, dayjs(endDate).diff(startDate, 'month') + 1),
        this.getOccupancyRate(branchId, startDate, endDate),
        this.getCancellationRate(branchId, startDate, endDate),
        this.getRoomTypePerformance(branchId, startDate, endDate),
        this.getBookingStats(branchId, startDate, endDate),
      ]);

    const analytics = {
      revenue,
      occupancyRate: occupancyRate.rate,
      cancellationRate,
      roomPerformance,
      bookingStats,
    } as AnalyticsSummaryDto;

    // Cache the results
    await this.databaseService.analyticsSummary.upsert({
      where: {
        branchId_period_period_type: {
          branchId,
          period: dayjs(startDate).startOf('month').toDate(),
          period_type: periodType,
        },
      },
      update: { metrics: analytics as any },
      create: {
        branchId,
        period: dayjs(startDate).startOf('month').toDate(),
        period_type: periodType,
        metrics: analytics as any,
      },
    });

    return analytics;
  }

  private async getBookingStats(branchId: string, startDate: Date, endDate: Date) {
    const bookings = await this.databaseService.booking.findMany({
      where: {
        room: { detail: { branchId } },
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        status: true,
        start_date: true,
        end_date: true,
      },
    });

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter((b) => b.status === BookingStatus.COMPLETED).length;
    const cancelledBookings = bookings.filter((b) => b.status === BookingStatus.CANCELLED).length;
    const averageStayDuration =
      bookings.reduce((sum, b) => sum + dayjs(b.end_date).diff(b.start_date, 'days'), 0) /
        totalBookings || 0;

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      averageStayDuration,
    };
  }

  private aggregateRevenueByMonth(bookings: any[], months: number): Record<string, number> {
    const timeline: Record<string, number> = {};
    const endDate = dayjs();

    for (let i = 0; i < months; i++) {
      const date = endDate.subtract(i, 'month');
      const key = date.format('YYYY-MM'); // YYYY-MM format
      timeline[key] = 0;
    }

    bookings.forEach((booking) => {
      const key = dayjs(booking.createdAt).format('YYYY-MM');
      if (timeline[key] !== undefined) {
        timeline[key] += Number(booking.total_amount);
      }
    });

    return timeline;
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT) // Run at 00:00 on the first day of every month
  async runMonthlyAnalytics() {
    const previousMonth = dayjs().subtract(1, 'month').toDate();
    await this.aggregateMonthlyAnalytics(previousMonth);
  }
}
