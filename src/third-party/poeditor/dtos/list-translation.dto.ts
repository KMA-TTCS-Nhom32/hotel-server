import { ApiProperty } from '@nestjs/swagger';

export class GetTranslationsRequestDto {
  @ApiProperty({
    example: 'en',
    description: 'Language code to fetch translations for',
  })
  language: string;
}

class TranslationContent {
  @ApiProperty({
    example: 'Hello world',
    description: 'Translated content',
  })
  content: string;

  @ApiProperty({
    example: 0,
    description: 'Fuzzy translation flag',
  })
  fuzzy: number;

  @ApiProperty({
    example: 1,
    description: 'Proofread status',
  })
  proofread: number;

  @ApiProperty({
    example: '2023-11-20 10:30:15',
    description: 'Last update timestamp',
  })
  updated: string;
}

class Term {
  @ApiProperty({
    example: 'welcome_message',
    description: 'Translation term key',
  })
  term: string;

  @ApiProperty({
    example: 'homepage',
    description: 'Context where the term is used',
  })
  context: string;

  @ApiProperty({
    example: 'messages',
    description: 'Plural form',
  })
  plural: string;

  @ApiProperty({
    example: '2023-11-20 10:30:15',
    description: 'Creation timestamp',
  })
  created: string;

  @ApiProperty({
    example: '2023-11-20 10:30:15',
    description: 'Last update timestamp',
  })
  updated: string;

  @ApiProperty({
    example: 'welcome.component.ts',
    description: 'Reference file or location',
  })
  reference: string;

  @ApiProperty({
    type: () => TranslationContent,
    description: 'Translation details',
  })
  translation: TranslationContent;
}

class ResponseStatus {
  @ApiProperty({
    example: 'success',
    description: 'Response status',
  })
  status: string;

  @ApiProperty({
    example: '200',
    description: 'Response code',
  })
  code: string;

  @ApiProperty({
    example: 'OK',
    description: 'Response message',
  })
  message: string;
}

export class ListTranslationResponseDto {
  @ApiProperty({
    type: ResponseStatus,
    description: 'API response status information',
  })
  response: ResponseStatus;

  @ApiProperty({
    type: 'object',
    properties: {
      terms: {
        type: () => [Term],
      },
    },
    description: 'Translation terms and their details',
  })
  result: {
    terms: Term[];
  };
}
