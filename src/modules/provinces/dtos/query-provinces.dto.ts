import { QueryManyWithPaginationDto, SortDto } from '@/common/dtos';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { JsonTransform } from 'libs/common';

export class FilterProvincesDto {
  @ApiPropertyOptional({
    type: String,
    example: 'keyword to search',
    description: 'Search by keyword',
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}

export type ProvinceSortFields = 'name' | 'zip_code' | 'createdAt' | 'updatedAt';

export class SortProvinceDto extends IntersectionType(SortDto<ProvinceSortFields>) {}

export class QueryProvincesDto extends QueryManyWithPaginationDto<
  FilterProvincesDto,
  SortProvinceDto
> {
  @ApiPropertyOptional({
    type: String,
    description: `JSON string of ${FilterProvincesDto.name}`,
  })
  @IsOptional()
  @JsonTransform(FilterProvincesDto)
  @ValidateNested()
  @Type(() => FilterProvincesDto)
  filters?: FilterProvincesDto | null;

  @ApiPropertyOptional({
    type: String,
    description: `JSON string of ${SortProvinceDto.name}[]`,
  })
  @IsOptional()
  @JsonTransform(SortProvinceDto)
  @ValidateNested({ each: true })
  @Type(() => SortProvinceDto)
  sort?: SortProvinceDto[] | null;
}
