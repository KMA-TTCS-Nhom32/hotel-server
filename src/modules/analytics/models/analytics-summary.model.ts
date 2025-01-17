import { ApiProperty } from '@nestjs/swagger';
import { AnalyticsPeriodType } from '@prisma/client';
import { AbstractModel } from 'libs/common';
import { AnalyticsMetricsDto } from '../dtos/analytics-metrics.dto';
import { Type } from 'class-transformer';

export class AnalyticsSummary extends AbstractModel {
  constructor(data: Partial<AnalyticsSummary>) {
    super();
    Object.assign(this, data);
  }

  @ApiProperty()
  branchId: string;

  @ApiProperty()
  period: Date;

  @ApiProperty({
    enum: AnalyticsPeriodType,
  })
  period_type: AnalyticsPeriodType;

  @ApiProperty({
    type: AnalyticsMetricsDto,
  })
  @Type(() => AnalyticsMetricsDto)
  metrics: AnalyticsMetricsDto;
}
