import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingType, DiscountType } from '@prisma/client';
import { RoomDetail } from '@/modules/room-detail/models';
import { PromotionTranslation } from './promotion-translation.model';
import { AbstractModel } from 'libs/common';
import { PrismaRoomPromotion } from '../interfaces';

export class RoomPromotion extends AbstractModel {
  constructor(data: Partial<PrismaRoomPromotion>) {
    super();

    const { translations, ...processedData } = data;

    const processedTranslations =
      translations?.map((translation) => ({
        language: translation.language,
        description: translation.description,
      })) || [];

    Object.assign(this, {
      ...processedData,
      translations: processedTranslations
    });
  }

  @ApiProperty({ description: 'Unique promotion code', example: 'SUMMER2025', type: String })
  code: string;

  @ApiProperty({
    description: 'Description of the promotion',
    example: 'Summer special discount',
    type: String,
  })
  description: string;

  @ApiProperty({
    description: 'Type of booking this promotion applies to',
    enum: BookingType,
    example: BookingType.NIGHTLY,
  })
  applied_type: BookingType;

  @ApiProperty({
    description: 'Type of discount (percentage or fixed amount)',
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
  })
  discount_type: DiscountType;

  @ApiProperty({
    description: 'Value of the discount (percentage or fixed amount)',
    example: 15,
    type: Number,
  })
  discount_value: number;

  @ApiProperty({ description: 'Start date of the promotion', type: Date })
  start_date: Date;

  @ApiProperty({ description: 'End date of the promotion', type: Date })
  end_date: Date;

  @ApiProperty({
    description: 'Minimum hours required for hourly booking promotion',
    example: 3,
    required: false,
    type: Number,
  })
  min_hours?: number;

  @ApiProperty({
    description: 'Minimum nights required for nightly booking promotion',
    example: 2,
    required: false,
    type: Number,
  })
  min_nights?: number;

  @ApiProperty({
    description: 'Minimum days required for daily booking promotion',
    example: 3,
    required: false,
    type: Number,
  })
  min_days?: number;

  @ApiProperty({
    description: 'Total times the promotion has been used',
    example: 10,
    type: Number,
  })
  total_used: number;

  @ApiPropertyOptional({
    description: 'Total number of codes available for the promotion',
    example: 100,
    type: Number,
  })
  total_code?: number;

  @ApiProperty({
    description: 'Translations for the promotion',
    type: [PromotionTranslation],
  })
  translations?: PromotionTranslation[];

  @ApiPropertyOptional({ description: 'Rooms associated with the promotion', type: [RoomDetail] })
  rooms?: RoomDetail[];
}
