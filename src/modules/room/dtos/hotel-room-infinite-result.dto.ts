import { InfinityPaginationResultType } from 'libs/common';
import { HotelRoom } from '../models';
import { ApiProperty } from '@nestjs/swagger';

export class InfiniteHotelRoomResultDto implements InfinityPaginationResultType<HotelRoom> {
  @ApiProperty({ type: [HotelRoom] })
  data: HotelRoom[];

  @ApiProperty({ example: true, type: Boolean })
  readonly hasNextPage: boolean;

  constructor(data: InfinityPaginationResultType<HotelRoom>) {
    this.data = data.data;
    this.hasNextPage = data.hasNextPage;
  }
}
