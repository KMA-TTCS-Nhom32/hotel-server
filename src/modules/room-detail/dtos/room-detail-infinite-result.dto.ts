import { InfinityPaginationResultType } from 'libs/common';
import { RoomDetail } from '../models';
import { ApiProperty } from '@nestjs/swagger';

export class InfiniteRoomDetailResultDto implements InfinityPaginationResultType<RoomDetail> {
  @ApiProperty({ type: [RoomDetail] })
  data: RoomDetail[];

  @ApiProperty({ example: true, type: Boolean })
  readonly hasNextPage: boolean;

  constructor(data: InfinityPaginationResultType<RoomDetail>) {
    this.data = data.data;
    this.hasNextPage = data.hasNextPage;
  }
}
