import { ApiPropertyOptional } from '@nestjs/swagger';
import { Amenity, AmenityType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { QueryManyWithPaginationDto, SortDto } from '@/common/dtos/filters-with-pagination.dto';

export class FilterAmenityDto {
  @ApiPropertyOptional({
    enum: AmenityType,
    example: [AmenityType.ROOM, AmenityType.SERVICE],
  })
  @IsOptional()
  @IsEnum(AmenityType, { each: true })
  types?: AmenityType[] | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class SortAmenityDto extends SortDto<Amenity> {}

export class QueryAmenityDto extends QueryManyWithPaginationDto<FilterAmenityDto, SortAmenityDto> {}