import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested, IsOptional } from 'class-validator';

class TranslationData {
  @ApiProperty({
    example: 'hello',
    description: 'The term to translate',
  })
  @IsString()
  term: string;

  @ApiProperty({
    example: 'bonjour',
    description: 'The translation of the term',
  })
  @IsString()
  translation: string;

  @ApiProperty({
    example: 'greeting',
    description: 'Optional context for the translation',
    required: false,
  })
  @IsOptional()
  @IsString()
  context?: string;
}

export class AddTranslationDto {
  //   @ApiProperty({
  //     example: 123456,
  //     description: 'The POEditor project ID',
  //   })
  //   @IsNumber()
  //   id: number;

  @ApiProperty({
    example: 'fr',
    description: 'The language code for the translations',
  })
  @IsString()
  language: string;

  @ApiProperty({
    type: [TranslationData],
    description: 'Array of translations to add',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationData)
  data: TranslationData[];
}
