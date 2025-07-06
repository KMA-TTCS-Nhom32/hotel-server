import { AbstractModel } from 'libs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HotelRoomStatus } from '@prisma/client';
import { Booking } from '@/modules/booking/models';
import { PrismaRoom } from '../interfaces';

export class HotelRoom extends AbstractModel {
  constructor(data: Partial<PrismaRoom>) {
    super();

    const { translations, ...processedData } = data;

    let processedTranslations = [];

    if (translations) {
      processedTranslations = translations.map((translation) => ({
        language: translation.language,
        name: translation.name,
      }));
    }

    Object.assign(this, {
      ...processedData,
      translations: processedTranslations,
    });
  }

  @ApiProperty({
    type: String,
    example: 'Hotel Room Name',
    description: "Hotel Room's name",
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'hotel-room-slug',
    description: "Hotel Room's slug",
  })
  slug: string;

  @ApiProperty({
    enum: HotelRoomStatus,
    example: HotelRoomStatus.AVAILABLE,
    description: "Hotel Room's status",
    type: String,
  })
  status: HotelRoomStatus;

  @ApiProperty({
    type: String,
    example: 'detail-id-123',
    description: 'ID of the room detail',
  })
  detailId: string;

//   @ApiPropertyOptional({
//     type: () => RoomDetail,
//     description: 'Room detail',
//   })
//   detail?: RoomDetail;

  @ApiPropertyOptional({ type: () => [Booking], description: 'List of bookings' })
  bookings?: Booking[];

  @ApiPropertyOptional({
    type: 'object',
    properties: {
      bookings: { type: 'number' },
    },
    description: 'Count of bookings',
  })
  _count?: {
    bookings: number;
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
    description: 'List of translations for the hotel room',
  })
  translations: {
    language: string;
    name: string;
  }[];
}

//   @ApiProperty({ type: () => [RoomPriceHistory], required: false })
//   roomPriceHistories?: RoomPriceHistory[];

//   @ApiProperty({ type: () => [RoomPromotion], required: false })
//   promotions?: RoomPromotion[];

//   @ApiProperty({ type: () => [Review], required: false })
//   reviews?: Review[];
