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
import { HotelRoomType, HotelRoomBedType } from '@prisma/client';
import { QueryManyWithPaginationDto, SortDto } from '@/common/dtos';
import { JsonTransform } from 'libs/common';
import { Type } from 'class-transformer';
import Decimal from 'decimal.js';
import { RoomDetail } from '../models';

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
