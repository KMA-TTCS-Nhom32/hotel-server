import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateBranchDto, BranchTranslationDto } from './create-branch.dto';
import { NearBy } from '../models';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

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
  @ValidateNested({ each: true })
  @Type(() => NearBy)
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(item => new NearBy(item));
    }
    return value;
  }, { toClassOnly: true })
  nearBy?: NearBy[];

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
