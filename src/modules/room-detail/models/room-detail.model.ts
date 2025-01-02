import { AbstractModel } from 'libs/common';
import { ApiProperty } from '@nestjs/swagger';
import { HotelRoomType, HotelRoomBedType } from '@prisma/client';
import { Amenity } from '@/modules/amenities/models';
import { HotelRoom } from '@/modules/room/models';
import { Image } from '@/modules/images/models';
import { Branch } from '@/modules/branch/models';
import Decimal from 'decimal.js';

export class RoomDetail extends AbstractModel {
  constructor(data: RoomDetail) {
    super();
    Object.assign(this, data);
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
    type: Branch,
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

  @ApiProperty({ type: () => [Amenity] })
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

  @ApiProperty({ type: () => [HotelRoom] })
  flat_rooms?: HotelRoom[];
}
