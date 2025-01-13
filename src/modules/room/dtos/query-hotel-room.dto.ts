import { QueryManyWithPaginationDto, SortDto } from '@/common/dtos';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HotelRoomStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { JsonTransform } from 'libs/common';
import { HotelRoom } from '../models';

export class FilterHotelRoomByDetailDto {
  @ApiProperty({
    type: String,
    example: 'detailId',
    description: 'Filter by hotel branch ID',
  })
  @IsString()
  @IsNotEmpty()
  branchId: string;
}

export class FilterHotelRoomDto {
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
    example: 'hotel-room-status',
    description: 'Filter by hotel room status',
    enum: HotelRoomStatus,
  })
  @IsOptional()
  @IsEnum(HotelRoomStatus)
  status?: HotelRoomStatus;

  @ApiPropertyOptional({
    type: String,
    example: 'detailId',
    description: 'Filter by room detail ID',
  })
  @IsOptional()
  @IsString()
  detailId?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'detail-slug',
    description: 'Filter by room detail slug',
  })
  @IsOptional()
  @IsString()
  detailSlug?: string;
}

export class SortHotelRoomDto extends SortDto<HotelRoom> {}

export class QueryHotelRoomDto extends QueryManyWithPaginationDto<
  FilterHotelRoomDto,
  SortHotelRoomDto
> {
  @ApiPropertyOptional({
    type: String,
    description: `JSON string of ${FilterHotelRoomDto.name}`,
  })
  @IsOptional()
  @JsonTransform(FilterHotelRoomDto)
  @ValidateNested()
  @Type(() => FilterHotelRoomDto)
  filters?: FilterHotelRoomDto | null;

  @ApiPropertyOptional({
    type: String,
    description: `JSON string of ${SortHotelRoomDto.name}[]`,
  })
  @IsOptional()
  @JsonTransform(SortHotelRoomDto)
  @ValidateNested({ each: true })
  @Type(() => SortHotelRoomDto)
  sort?: SortHotelRoomDto[] | null;
}
