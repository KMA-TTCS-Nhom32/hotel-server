import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AmenityType } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Image } from '@/modules/images/models';
import { Type } from 'class-transformer';
import { AmenityTranslationDto } from './translation.dto';

export class CreateAmenityDto {
  @ApiProperty({
    example: 'Swimming Pool',
    description: 'The name of the amenity',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'swimming-pool',
    description: 'URL-friendly version of the name (lowercase, hyphenated)',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase and hyphen-separated',
  })
  @MaxLength(100)
  slug: string;

  @ApiProperty({
    enum: AmenityType,
    example: AmenityType.PROPERTY,
    description: 'Type of amenity (ROOM, PROPERTY, or SERVICE)',
    type: String,
  })
  @IsEnum(AmenityType)
  @IsNotEmpty()
  type: AmenityType;

  @ApiProperty({
    type: Image,
    description: 'Icon image details',
  })
  @Type(() => Image)
  @IsNotEmpty()
  icon: Image;

  @ApiPropertyOptional({
    type: [AmenityTranslationDto],
    description: 'Translations for the amenity',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AmenityTranslationDto)
  translations?: AmenityTranslationDto[];
}

export class UpdateAmenityDto extends PartialType(CreateAmenityDto) {}
