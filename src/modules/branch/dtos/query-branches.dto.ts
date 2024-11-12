import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { QueryManyWithPaginationDto, SortDto } from '@/common/dtos/filters-with-pagination.dto';

export class FilterBranchesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  @IsArray()
  amenities?: string[];
}

export type BranchSortFields = 'name' | 'rating' | 'createdAt';

export class QueryBranchesDto extends QueryManyWithPaginationDto<
  FilterBranchesDto,
  SortDto<BranchSortFields>
> {}
