import { QueryManyWithPaginationDto, SortDto } from '@/common/dtos';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { JsonTransform } from 'libs/common';

export class GetLastestBranchesDto {
  @ApiPropertyOptional({
    type: Number,
    example: 3,
    default: 3,
    description: 'Number of branches to get',
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  limit?: number;
}

export class FilterBranchesDto {
  @ApiPropertyOptional({
    type: String,
    example: 'keyword to search',
    description: 'Search by keyword',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Filter by active status',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 5,
    description: 'Filter by rating',
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'provinceId',
    description: 'Filter by province',
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

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  @IsArray()
  amenities?: string[];
}

export type BranchSortFields = 'name' | 'rating' | 'createdAt';

export class SortBranchDto extends SortDto<BranchSortFields> {}

export class QueryBranchesDto extends QueryManyWithPaginationDto<FilterBranchesDto, SortBranchDto> {
  @ApiPropertyOptional({
    type: String,
    description: `JSON string of ${FilterBranchesDto.name}`,
  })
  @IsOptional()
  @JsonTransform(FilterBranchesDto)
  @ValidateNested()
  @Type(() => FilterBranchesDto)
  filters?: FilterBranchesDto | null;

  @ApiPropertyOptional({
    type: String,
    description: `JSON string of ${SortBranchDto.name}[]`,
  })
  @IsOptional()
  @JsonTransform(SortBranchDto)
  @ValidateNested({ each: true })
  @Type(() => SortBranchDto)
  sort?: SortBranchDto[] | null;
}
