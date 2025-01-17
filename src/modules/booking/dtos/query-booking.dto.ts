import { QueryManyWithPaginationDto, SortDto } from '@/common/dtos';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus, BookingType, PaymentMethod, PaymentStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { JsonTransform } from 'libs/common';

export class FilterMyBookingsDto {
  @ApiPropertyOptional({
    type: [String],
    enum: BookingStatus,
    example: [BookingStatus.PENDING],
    description: 'Filter by booking status',
  })
  @IsOptional()
  @IsEnum(BookingStatus, { each: true })
  status?: BookingStatus[];
}

export class FilterBookingsDto extends FilterMyBookingsDto {
  @ApiPropertyOptional({
    type: String,
    enum: BookingType,
    example: BookingType.HOURLY,
    description: 'Filter by booking type',
  })
  @IsOptional()
  @IsEnum(BookingType)
  type?: BookingType;

  @ApiPropertyOptional({
    type: String,
    example: 'keyword to search',
    description: 'Search by keyword',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'branchId',
    description: 'Filter by branch',
  })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'userId',
    description: 'Filter by user',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'roomDetailId',
    description: 'Filter by room detail',
  })
  @IsOptional()
  @IsString()
  detailId?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'roomId',
    description: 'Filter by room',
  })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional({
    type: String,
    example: '2022-12-31',
    description: 'Filter by start date',
  })
  @IsOptional()
  @IsString()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    type: String,
    example: '2022-12-31',
    description: 'Filter by end date',
  })
  @IsOptional()
  @IsString()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    type: String,
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
    description: 'Filter by payment status',
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  payment_status?: PaymentStatus;

  @ApiPropertyOptional({
    type: String,
    enum: PaymentMethod,
    example: PaymentMethod.VIET_QR,
    description: 'Filter by payment method',
  })
  payment_method?: PaymentMethod;
}

export type BookingSortFields = {
  createdAt: 'sort by created date';
  branchName: 'sort by branch name';
};

export class SortBookingsDto extends SortDto<BookingSortFields> {}

export class QueryBookingsDto extends QueryManyWithPaginationDto<
  FilterBookingsDto,
  SortBookingsDto
> {
  @ApiPropertyOptional({
    type: String,
    description: `JSON string of ${FilterBookingsDto.name}`,
  })
  @IsOptional()
  @JsonTransform(FilterBookingsDto)
  @ValidateNested()
  @Type(() => FilterBookingsDto)
  filters?: FilterBookingsDto | null;

  @ApiPropertyOptional({
    type: String,
    description: `JSON string of ${SortBookingsDto.name}[]`,
  })
  @IsOptional()
  @JsonTransform(SortBookingsDto)
  @ValidateNested({ each: true })
  @Type(() => SortBookingsDto)
  sort?: SortBookingsDto[] | null;
}

export class QueryMyBookingsDto {
  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  pageSize?: number;

  @ApiPropertyOptional({
    type: FilterMyBookingsDto,
    description: 'Filter my bookings',
  })
  @IsOptional()
  @JsonTransform(FilterMyBookingsDto)
  @ValidateNested()
  @Type(() => FilterMyBookingsDto)
  filters?: FilterMyBookingsDto;
}
