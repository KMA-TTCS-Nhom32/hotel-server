import { QueryManyWithPaginationDto, SortDto } from '@/common/dtos';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterProvincesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;
}

export type ProvinceSortFields = 'name' | 'zip_code' | 'createdAt' | 'updatedAt';

export class QueryProvincesDto extends QueryManyWithPaginationDto<
  FilterProvincesDto,
  SortDto<ProvinceSortFields>
> {}
