import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  ValidateNested,
  IsArray,
  IsDecimal,
  IsNumber,
} from 'class-validator';
import { HotelRoomType, HotelRoomBedType, BookingType } from '@prisma/client';
import { QueryManyWithPaginationDto, SortDto } from '@/common/dtos';
import { JsonTransform } from 'libs/common';
import { Type } from 'class-transformer';
import Decimal from 'decimal.js';
import { RoomDetail } from '../models';
import { IsDateFormat } from '@/common/decorators/is-date-format.decorator';

export class FilterRoomDetailDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ enum: HotelRoomType })
  @IsOptional()
  @IsEnum(HotelRoomType)
  room_type?: HotelRoomType;

  @ApiPropertyOptional({ enum: HotelRoomBedType })
  @IsOptional()
  @IsEnum(HotelRoomBedType)
  bed_type?: HotelRoomBedType;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Filter by rating',
  })
  @IsOptional()
  @IsNumber()
  rating_from?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 5,
    description: 'Filter by rating',
  })
  @IsOptional()
  @IsNumber()
  rating_to?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'branchId',
    description: 'Filter by branch ID',
  })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'branch-slug',
    description: 'Filter by branch slug',
  })
  @IsOptional()
  @IsString()
  branchSlug?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'provinceId',
    description: 'Filter by province ID',
  })
  @IsOptional()
  @IsString()
  provinceId?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'province-slug',
    description: 'Filter by province slug',
  })
  @IsOptional()
  @IsString()
  provinceSlug?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['amenity-1', 'amenity-2'],
    description: 'Filter by amenities',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => String)
  @IsArray()
  amenities?: string[];

  @ApiPropertyOptional({
    type: Decimal,
    example: 100000,
    description: 'Filter by minimum price',
  })
  @IsOptional()
  @IsDecimal()
  minPrice?: Decimal;

  @ApiPropertyOptional({
    type: Decimal,
    example: 200000,
    description: 'Filter by maximum price',
  })
  @IsOptional()
  @IsDecimal()
  maxPrice?: Decimal;

  @ApiPropertyOptional({
    type: String,
    example: '16-01-2025',
    description: 'Filter by start date (DD-MM-YYYY)',
  })
  @IsOptional()
  @IsString()
  @IsDateFormat('DD-MM-YYYY', { message: 'startDate must be in format DD-MM-YYYY' })
  startDate?: string;

  @ApiPropertyOptional({
    type: String,
    example: '16-01-2025',
    description: 'Filter by end date (DD-MM-YYYY)',
  })
  @IsOptional()
  @IsString()
  @IsDateFormat('DD-MM-YYYY', { message: 'endDate must be in format DD-MM-YYYY' })
  endDate?: string;

  @ApiPropertyOptional({
    type: String,
    example: '08:00',
    description: 'Filter by start time',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({
    type: String,
    example: '18:00',
    description: 'Filter by end time',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({
    type: String,
    enum: BookingType,
    example: BookingType.HOURLY,
    description: 'Filter by booking type',
  })
  @IsOptional()
  @IsEnum(BookingType)
  bookingType?: BookingType;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Filter by number of adults',
  })
  @IsOptional()
  @IsNumber()
  adults?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Filter by number of children',
  })
  @IsOptional()
  @IsNumber()
  children?: number;
}

export class SortRoomDetailDto extends SortDto<RoomDetail> {}

export class QueryRoomDetailDto extends QueryManyWithPaginationDto<
  FilterRoomDetailDto,
  SortRoomDetailDto
> {
  @ApiPropertyOptional({
    type: String,
    description: `JSON string of ${FilterRoomDetailDto.name}`,
  })
  @IsOptional()
  @JsonTransform(FilterRoomDetailDto)
  @ValidateNested()
  @Type(() => FilterRoomDetailDto)
  filters?: FilterRoomDetailDto | null;

  @ApiPropertyOptional()
  @IsOptional()
  @JsonTransform(SortRoomDetailDto)
  @ValidateNested({ each: true })
  @Type(() => SortRoomDetailDto)
  sort?: SortRoomDetailDto[] | null;
}
