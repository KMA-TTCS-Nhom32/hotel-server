import { ApiProperty } from '@nestjs/swagger';
import { Language } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PromotionTranslationDto {
  @ApiProperty({
    description: 'Language of the translation',
    enum: Language,
    example: Language.EN,
  })
  @IsNotEmpty()
  @IsEnum(Language)
  language: Language;

  @ApiProperty({
    description: 'Translated description of the promotion',
    example: 'Special summer discount for all luxury rooms',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'ID of the translation (required for updates)',
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;
}
