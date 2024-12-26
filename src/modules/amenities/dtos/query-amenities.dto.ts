import { ApiPropertyOptional } from '@nestjs/swagger';
import { Amenity, AmenityType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { QueryManyWithPaginationDto, SortDto } from '@/common/dtos/filters-with-pagination.dto';
import { JsonTransform } from 'libs/common';

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

export class QueryAmenityDto extends QueryManyWithPaginationDto<FilterAmenityDto, SortAmenityDto> {
  @ApiPropertyOptional({
    type: String,
    example: 'keyword to search',
    description: `JSON string of ${FilterAmenityDto.name}`,
  })
  @IsOptional()
  @JsonTransform(FilterAmenityDto)
  @ValidateNested()
  @Type(() => FilterAmenityDto)
  filters?: FilterAmenityDto | null;

  @ApiPropertyOptional({
    type: String,
    example: 'name:asc',
    description: `JSON string of ${SortAmenityDto.name}`,
  })
  @IsOptional()
  @JsonTransform(SortAmenityDto)
  @ValidateNested()
  @Type(() => SortAmenityDto)
  sort?: SortAmenityDto[] | null;
}
