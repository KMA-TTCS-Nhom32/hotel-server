import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetTranslationsRequestDto {
  @ApiPropertyOptional({
    example: 'en',
    description: 'Language code to fetch translations for'
  })
  @IsOptional()
  @IsString()
  language?: string;
}

export class DetailTranslationContent {
  @ApiProperty()
  content: string;

  @ApiProperty()
  fuzzy: number;

  @ApiProperty()
  proofread: number;

  @ApiProperty()
  updated: string;
}

export class Term {
  @ApiProperty()
  term: string;

  @ApiProperty()
  context: string;

  @ApiProperty({ required: false })
  plural: string;

  @ApiProperty({ required: false })
  created: string;

  @ApiProperty({ required: false })
  updated: string;

  @ApiProperty({ required: false })
  reference: string;

  @ApiProperty({ type: () => DetailTranslationContent })
  translation: DetailTranslationContent;
}

export class ResponseStatus {
  @ApiProperty()
  status: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  message: string;
}

export class ListTranslationResult {
  @ApiProperty({ type: [Term] })
  terms: Term[];
}

export class ListTranslationResponseDto {
  @ApiProperty({ type: ResponseStatus })
  response: ResponseStatus;

  @ApiProperty({ type: ListTranslationResult })
  result: ListTranslationResult;
}
