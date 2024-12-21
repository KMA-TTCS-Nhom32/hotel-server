import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { HotelRoomType, HotelRoomBedType } from '@prisma/client';
import { QueryManyWithPaginationDto, SortDto } from '@/common/dtos';

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
}

export type RoomDetailSortFields = 'name' | 'room_type' | 'bed_type' | 'createdAt' | 'updatedAt';

export class QueryRoomDetailDto extends QueryManyWithPaginationDto<
  FilterRoomDetailDto,
  SortDto<RoomDetailSortFields>
> {}
