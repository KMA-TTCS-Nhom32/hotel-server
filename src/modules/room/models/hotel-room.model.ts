import { AbstractModel } from 'libs/common';
import { ApiProperty } from '@nestjs/swagger';
import { HotelRoomStatus } from '@prisma/client';
import { Image } from '@/modules/images/models';
// import { RoomPriceHistory } from '@/modules/room-price/models';
// import { RoomPromotion } from '@/modules/promotions/models';
// import { Booking } from '@/modules/bookings/models';
// import { Review } from '@/modules/reviews/models';

export class HotelRoom extends AbstractModel {
  constructor(data: Partial<HotelRoom>) {
    super();
    Object.assign(this, data);
  }

  @ApiProperty()
  name: string;

  @ApiProperty({ type: Image })
  thumbnail: any;

  @ApiProperty({ type: () => [Image] })
  images: any[];

  @ApiProperty({ enum: HotelRoomStatus })
  status: HotelRoomStatus;

  @ApiProperty()
  branchId: string;

  @ApiProperty()
  detailId: string;

  @ApiProperty()
  base_price_per_hour: number;

  @ApiProperty({ required: false })
  special_price_per_hour?: number;

  @ApiProperty()
  base_price_per_night: number;

  @ApiProperty({ required: false })
  special_price_per_night?: number;

  @ApiProperty()
  base_price_per_day: number;

  @ApiProperty({ required: false })
  special_price_per_day?: number;

//   @ApiProperty({ type: () => [RoomPriceHistory], required: false })
//   roomPriceHistories?: RoomPriceHistory[];

//   @ApiProperty({ type: () => [RoomPromotion], required: false })
//   promotions?: RoomPromotion[];

//   @ApiProperty({ type: () => [Booking], required: false })
//   bookings?: Booking[];

//   @ApiProperty({ type: () => [Review], required: false })
//   reviews?: Review[];
}
