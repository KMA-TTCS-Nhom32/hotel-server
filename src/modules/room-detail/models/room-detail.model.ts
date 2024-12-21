import { AbstractModel } from 'libs/common';
import { ApiProperty } from '@nestjs/swagger';
import { HotelRoomType, HotelRoomBedType } from '@prisma/client';
import { Amenity } from '@/modules/amenities/models';
import { HotelRoom } from '@/modules/room/models';

export class RoomDetail extends AbstractModel {
  constructor(data: RoomDetail) {
    super();
    Object.assign(this, data);
  }

  @ApiProperty({ example: 'Deluxe Room' })
  name: string;

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

  @ApiProperty({ type: () => [HotelRoom] })
  rooms?: HotelRoom[];
}
