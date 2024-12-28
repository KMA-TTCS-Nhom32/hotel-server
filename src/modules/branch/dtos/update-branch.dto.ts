import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateBranchDto } from './create-branch.dto';
import { NearBy } from '../models';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBranchDto extends PartialType(CreateBranchDto) {
  @ApiPropertyOptional({
    type: [String],
    description: 'Branch amenities',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenityIds?: string[];

  @ApiPropertyOptional({
    type: [NearBy],
    description: 'Nearby locations',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NearBy)
  @IsArray()
  nearBy?: NearBy[];
}
