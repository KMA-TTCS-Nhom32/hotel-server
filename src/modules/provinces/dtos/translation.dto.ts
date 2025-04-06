import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Language } from '@prisma/client';

export class ProvinceTranslationDto {
  @ApiProperty({
    enum: Language,
    example: Language.EN,
    description: 'Language of the translation',
  })
  @IsEnum(Language)
  @IsNotEmpty()
  language: Language;

  @ApiProperty({
    type: String,
    example: 'Ho Chi Minh City',
    description: 'Translated name of the province',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateProvinceTranslationDto extends ProvinceTranslationDto {
  @ApiProperty({
    type: String,
    example: 'province-id-123',
    description: 'ID of the province',
  })
  @IsString()
  @IsNotEmpty()
  provinceId: string;
}
