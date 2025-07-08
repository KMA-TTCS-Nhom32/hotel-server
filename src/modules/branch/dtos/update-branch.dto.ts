import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateBranchDto, BranchTranslationDto } from './create-branch.dto';
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
  @IsArray()
  @ValidateNested({ each: true }) // Add 'each: true' to validate each item in the array
  @Type(() => NearBy)
  nearBy?: NearBy[];
  
  // Add a method to handle the transformation of nearBy
  setNearBy(data: any[]) {
    if (Array.isArray(data)) {
      this.nearBy = data.map(item => new NearBy(item));
    }
    return this;
  }

  @ApiPropertyOptional({
    type: [BranchTranslationDto],
    description: 'Translations for the branch',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BranchTranslationDto)
  translations?: BranchTranslationDto[];
}
