import { AbstractModel } from 'libs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Province extends AbstractModel {
  constructor(data: Partial<Province>) {
    super();
    Object.assign(this, data);
  }

  @ApiProperty({
    type: String,
    example: 'Ha Noi',
    description: 'Name of the province',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: '100000',
    description: 'ZIP/Postal code of the province',
  })
  zip_code: string;

  @ApiProperty({
    type: String,
    example: 'hanoi',
    description: 'Slug of the province',
  })
  slug: string;

  @ApiPropertyOptional({
    description: 'Count of branches in the province',
    example: { branches: 5 },
    type: 'object',
    properties: {
      branches: { type: 'number' },
    },
  })
  _count?: {
    branches: number;
  };

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        language: { type: 'string' },
        name: { type: 'string' },
      },
    },
    description: 'List of translations for the province',
  })
  translations: {
    language: string;
    name: string;
  }[];
}
