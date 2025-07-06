import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Language } from '@prisma/client';

export class AmenityTranslationDto {
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
    example: 'Swimming Pool',
    description: 'Translated name of the amenity',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateAmenityTranslationDto extends AmenityTranslationDto {
  @ApiProperty({
    type: String,
    example: 'amenity-id-123',
    description: 'ID of the amenity',
  })
  @IsString()
  @IsNotEmpty()
  amenityId: string;
}
