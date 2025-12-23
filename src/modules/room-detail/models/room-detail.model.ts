import { AbstractModel } from 'libs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HotelRoomType, HotelRoomBedType } from '@prisma/client';
import { Amenity } from '@/modules/amenities/models';
import { HotelRoom } from '@/modules/room/models';
import { Image } from '@/modules/images/models';
import { Branch } from '@/modules/branch/models';
import Decimal from 'decimal.js';
import { RoomPriceHistory } from '@/modules/room-price-history/models.ts';
import { PrismaRoomDetail } from '../interfaces';

export class RoomDetail extends AbstractModel {
  constructor(data: Partial<PrismaRoomDetail>) {
    super();

    const { translations, amenities, roomPriceHistories, ...processedData } = data;

    const processedTranslations =
      translations?.map((translation) => ({
        language: translation.language,
        name: translation.name,
        description: translation.description,
      })) || [];

    Object.assign(this, {
      ...processedData,
      amenities: amenities?.map((amenity) => new Amenity(amenity)) || [],
      roomPriceHistories: roomPriceHistories?.map((history) => new RoomPriceHistory(history)) || [],
      translations: processedTranslations,
    });
  }

  @ApiProperty({ example: 'Deluxe Room' })
  name: string;

  @ApiProperty({
    type: String,
    example: 'hotel-detail-slug',
    description: "Hotel Detail's slug",
  })
  slug: string;

  @ApiProperty({
    type: String,
    example: 'branch-id-123',
    description: 'ID of the branch where this room is located',
  })
  branchId: string;

  @ApiProperty({
    type: () => Branch,
    description: 'Branch where this room is located',
  })
  branch?: Branch;

  @ApiProperty({ type: Image, description: "Hotel Room's thumbnail image" })
  thumbnail: Image;

  @ApiProperty({ type: [Image], description: "Hotel Room's image gallery" })
  images: Image[];

  @ApiProperty({ example: 'Spacious room with city view' })
  description: string;

  @ApiProperty({ enum: HotelRoomType })
  room_type: HotelRoomType;

  @ApiProperty({ enum: HotelRoomBedType })
  bed_type: HotelRoomBedType;

  @ApiProperty({ example: 30, description: 'Room area in square meters' })
  area: number;

  @ApiProperty({ type: [Amenity] })
  amenities: Amenity[];

  @ApiProperty({ example: 2 })
  max_adults: number;

  @ApiProperty({ example: 2 })
  max_children: number;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty({
    type: String,
    example: '300000',
    description: "Hotel Room's base price per hour",
  })
  base_price_per_hour: Decimal;

  @ApiProperty({
    required: false,
    type: String,
    example: '200000',
    description: "Hotel Room's special price per hour",
  })
  special_price_per_hour?: Decimal;

  @ApiProperty({
    type: String,
    example: '500000',
    description: "Hotel Room's base price per night",
  })
  base_price_per_night: Decimal;

  @ApiProperty({
    required: false,
    type: String,
    example: '400000',
    description: "Hotel Room's special price per night",
  })
  special_price_per_night?: Decimal;

  @ApiProperty({
    type: String,
    example: '1000000',
    description: "Hotel Room's base price per day",
  })
  base_price_per_day: Decimal;

  @ApiProperty({
    required: false,
    type: String,
    example: '900000',
    description: "Hotel Room's special price per day",
  })
  special_price_per_day?: Decimal;

  //   @ApiProperty({ type: () => [HotelRoom] })
  //   flat_rooms?: HotelRoom[];

  @ApiPropertyOptional({
    type: () => [RoomPriceHistory],
    description: 'Price history of this room',
  })
  roomPriceHistories?: RoomPriceHistory[];

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Whether this room is available for booking',
  })
  is_available: boolean;

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
    description: 'List of translations for the room detail',
  })
  translations: {
    language: string;
    name: string;
    description: string;
  }[];
}

export class RoomDetailWithList extends RoomDetail {
  @ApiProperty({ type: () => [HotelRoom] })
  flat_rooms?: HotelRoom[];
}
