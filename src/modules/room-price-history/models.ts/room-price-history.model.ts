import { RoomDetail } from '@/modules/room-detail/models';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { AbstractModel } from 'libs/common';
import { PrismaRoomPriceHistory } from '../interfaces';

export class RoomPriceHistory extends AbstractModel {
  constructor(data: Partial<PrismaRoomPriceHistory>) {
    super();

    const { translations, ...processedData } = data;

    let processedTranslations = [];

    if (translations) {
      processedTranslations = translations.map((translation) => ({
        language: translation.language,
        name: translation.name,
        description: translation.description,
      }));
    }

    Object.assign(this, {
      ...processedData,
      translations: processedTranslations,
    });
  }

  @ApiProperty({
    type: String,
    example: 'Quoc Khanh',
    description: 'Name of the price history',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'Ap dung vao ngay le quoc khanh 2/9',
    description: 'Description of the price history',
  })
  description: string;

  @ApiProperty({
    type: String,
    description: 'ID of the room detail this price history belongs to',
  })
  roomDetailId: string;

  @ApiPropertyOptional({
    type: () => RoomDetail,
    description: 'The associated room detail',
  })
  roomDetail?: RoomDetail;

  @ApiProperty({
    type: String,
    description: 'Price per hour for the room',
    example: '300000',
  })
  price_per_hour: Decimal;

  @ApiProperty({
    type: String,
    description: 'Price per night for the room',
    example: '600000',
  })
  price_per_night: Decimal;

  @ApiProperty({
    type: String,
    description: 'Price per day for the room',
    example: '700000',
  })
  price_per_day: Decimal;

  @ApiProperty({
    type: String,
    description: 'Start date when this price becomes effective',
    example: '2024-01-01',
  })
  effective_from: string;

  @ApiProperty({
    type: String,
    description: 'End date when this price expires',
    example: '2024-12-31',
  })
  effective_to: string;

  @ApiProperty({
    type: Boolean,
    description: 'Whether this price is currently being applied',
    example: true,
    default: false,
  })
  is_applied: boolean;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        language: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
      },
    },
    description: 'List of translations for the price history',
  })
  translations: {
    language: string;
    name: string;
    description: string;
  }[];
}
