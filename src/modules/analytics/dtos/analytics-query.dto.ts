import { ApiPropertyOptional } from "@nestjs/swagger";
import { AnalyticsPeriodType } from "@prisma/client";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";


export class GetAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Branch ID to get analytics for',
    example: 'branch-123',
  })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({
    description: 'Start date for analytics (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for analytics (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Period type for analytics',
    enum: AnalyticsPeriodType,
    example: AnalyticsPeriodType.MONTHLY,
  })
  @IsEnum(AnalyticsPeriodType)
  @IsOptional()
  periodType?: AnalyticsPeriodType;

  @ApiPropertyOptional({
    description: 'Number of months to analyze',
    example: 6,
  })
  @IsOptional()
  months?: number;
}
