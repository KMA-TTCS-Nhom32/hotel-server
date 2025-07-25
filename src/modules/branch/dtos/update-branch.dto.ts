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
    examples: [
      {
        name: 'Central Park',
        distance: '1.5 km',
      },
      {
        name: 'City Mall',
        distance: '2.0 km',
      },
    ],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NearBy)
  @IsArray()
  nearBy?: NearBy[];

  @ApiPropertyOptional({
    type: [BranchTranslationDto],
    description: 'Translations for the branch',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BranchTranslationDto)
  @IsArray()
  translations?: BranchTranslationDto[];
}
