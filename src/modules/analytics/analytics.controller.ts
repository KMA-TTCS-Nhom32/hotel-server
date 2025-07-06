import { Controller, Get, HttpException, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsSummaryDto,
  RevenueTimelineDto,
  OccupancyRateResponseDto,
  RoomPerformanceDto,
  GetAnalyticsQueryDto,
} from './dtos';
import { RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole } from '@prisma/client';
import dayjs from 'dayjs';

@ApiTags('Analytics')
@ApiExtraModels(
  AnalyticsSummaryDto,
  RevenueTimelineDto,
  OccupancyRateResponseDto,
  RoomPerformanceDto,
  GetAnalyticsQueryDto,
)
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get analytics summary for a branch' })
  @ApiOkResponse({
    type: AnalyticsSummaryDto,
  })
  async getAnalyticsSummary(@Query() query: GetAnalyticsQueryDto): Promise<AnalyticsSummaryDto> {
    const { branchId, startDate, endDate, periodType } = query;

    if (!branchId) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Branch ID is required',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const start = startDate ? dayjs(startDate).toDate() : dayjs().startOf('month').toDate();
    const end = endDate ? dayjs(endDate).toDate() : dayjs().endOf('month').toDate();

    return this.analyticsService.getAnalyticsSummary(branchId, start, end, periodType);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiOkResponse({
    type: RevenueTimelineDto,
  })
  async getRevenueAnalytics(@Query() query: GetAnalyticsQueryDto): Promise<RevenueTimelineDto> {
    const { branchId, months = 12 } = query;

    if (!branchId) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Branch ID is required',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return this.analyticsService.getRevenueTimeline(branchId, months);
  }

  @Get('occupancy')
  @ApiOperation({ summary: 'Get occupancy rate analytics' })
  @ApiOkResponse({
    type: OccupancyRateResponseDto,
  })
  async getOccupancyRate(@Query() query: GetAnalyticsQueryDto): Promise<OccupancyRateResponseDto> {
    const { branchId, startDate, endDate } = query;

    if (!branchId) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Branch ID is required',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const start = startDate ? dayjs(startDate).toDate() : dayjs().startOf('month').toDate();
    const end = endDate ? dayjs(endDate).toDate() : dayjs().endOf('month').toDate();

    return this.analyticsService.getOccupancyRate(branchId, start, end);
  }

  @Get('room-performance')
  @ApiOperation({ summary: 'Get room performance analytics' })
  @ApiOkResponse({
    type: [RoomPerformanceDto],
  })
  async getRoomPerformance(@Query() query: GetAnalyticsQueryDto): Promise<RoomPerformanceDto[]> {
    const { branchId, startDate, endDate } = query;

    if (!branchId) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Branch ID is required',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const start = startDate ? dayjs(startDate).toDate() : dayjs().startOf('month').toDate();
    const end = endDate ? dayjs(endDate).toDate() : dayjs().endOf('month').toDate();

    return this.analyticsService.getRoomTypePerformance(branchId, start, end);
  }
}
