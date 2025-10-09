import { Image } from '@/modules/images/models';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Language } from '@prisma/client';
import { NearBy } from '../models';

export class BranchTranslationDto {
  @ApiProperty({
    enum: Language,
    example: Language.EN,
    description: 'Language of the translation',
  })
  @IsNotEmpty()
  language: Language;

  @ApiProperty({
    example: 'Hotel XYZ Branch',
    description: 'Translated name of the branch',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'A beautiful hotel branch with amazing views',
    description: 'Translated description of the branch',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    example: '123 Main Street, City',
    description: 'Translated address of the branch',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiPropertyOptional({
    type: [NearBy],
    description: 'Translated nearby locations information',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NearBy)
  @IsArray()
  nearBy?: NearBy[];
}

export class CreateBranchDto {
  @ApiProperty({
    example: 'province-id-123',
    description: 'ID of the province where this branch is located',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  provinceId: string;

  @ApiProperty({
    example: { url: 'thumbnail-url', publicId: 'thumbnail-public-id' },
    description: "The branch's thumbnail image.",
    type: Image,
  })
  @Type(() => Image)
  @IsNotEmpty()
  thumbnail: Image;

  @ApiProperty({
    example: [{ url: 'image-url-1', publicId: 'public-id-1' }],
    description: "The branch's images.",
    type: [Image],
  })
  @ValidateNested()
  @Type(() => Image)
  @IsArray()
  images: Image[];

  @ApiProperty({
    example: 'Branch Name',
    description: "The branch's name.",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'branch-slug',
    description: "The branch's slug.",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({
    example: 'Branch Description',
    description: "The branch's description.",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    example: '0123456789',
    description: "The branch's phone number.",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    example: true,
    description: "The branch's active status.",
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  is_active: boolean;

  @ApiProperty({
    example: 'Branch Address',
    description: "The branch's address.",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    example: 4.5,
    description: "The branch's rating.",
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  rating: number;

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
