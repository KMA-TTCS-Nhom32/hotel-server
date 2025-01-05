import { AbstractModel } from 'libs/common';
import { ApiProperty } from '@nestjs/swagger';
import { HotelRoomStatus } from '@prisma/client';
import { RoomDetail } from '@/modules/room-detail/models';
import { Branch } from '@/modules/branch/models/branch.model';
// import { RoomPriceHistory } from '@/modules/room-price/models';
// import { RoomPromotion } from '@/modules/promotions/models';
// import { Booking } from '@/modules/bookings/models';
// import { Review } from '@/modules/reviews/models';

export class HotelRoom extends AbstractModel {
  constructor(data: Partial<HotelRoom>) {
    super();
    Object.assign(this, data);
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

  @ApiProperty({
    type: () => RoomDetail,
    description: 'Room detail',
  })
  detail?: RoomDetail;
}

//   @ApiProperty({ type: () => [RoomPriceHistory], required: false })
//   roomPriceHistories?: RoomPriceHistory[];

//   @ApiProperty({ type: () => [RoomPromotion], required: false })
//   promotions?: RoomPromotion[];

//   @ApiProperty({ type: () => [Booking], required: false })
//   bookings?: Booking[];

//   @ApiProperty({ type: () => [Review], required: false })
//   reviews?: Review[];
