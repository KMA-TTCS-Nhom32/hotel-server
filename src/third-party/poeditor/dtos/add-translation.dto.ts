import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested, IsOptional } from 'class-validator';

export class TranslationContent {
  @ApiProperty()
  @IsString()
  content: string;
}

export class TranslationData {
  @ApiProperty({
    example: 'hello',
    description: 'The term to translate',
  })
  @IsString()
  term: string;

  @ApiProperty({ type: TranslationContent })
  @ValidateNested()
  @Type(() => TranslationContent)
  translation: TranslationContent;

  @ApiPropertyOptional({
    example: 'greeting',
    description: 'Optional context for the translation',
    required: false,
  })
  @IsOptional()
  @IsString()
  context?: string;
}

export class AddTranslationDto {
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
