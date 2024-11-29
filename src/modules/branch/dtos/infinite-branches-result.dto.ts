import { ApiProperty } from '@nestjs/swagger';
import { Branch } from '../models';
import { InfinityPaginationResultType } from 'libs/common';

export class InfiniteBranchesResultDto implements InfinityPaginationResultType<Branch> {
  @ApiProperty({ type: [Branch] })
  data: Branch[];

  @ApiProperty({ example: true, type: Boolean })
  readonly hasNextPage: boolean;

  constructor(data: InfinityPaginationResultType<Branch>) {
    this.data = data.data;
    this.hasNextPage = data.hasNextPage;
  }
}
