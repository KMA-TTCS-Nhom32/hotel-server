import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse, PaginationMetaResponse } from 'libs/common/utils';
import { Branch } from '../models';

export class BranchesPaginationResultDto implements PaginatedResponse<Branch> {
  @ApiProperty({
    type: [Branch]
  })
  data: Branch[];

  @ApiProperty({
    type: 'object',
    properties: {
      total: { type: 'number' },
      page: { type: 'number' },
      pageSize: { type: 'number' },
      totalPages: { type: 'number' },
    },
    example: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
  })
  meta: PaginationMetaResponse;

  constructor(data: PaginatedResponse<Branch>) {
    this.data = data.data;
    this.meta = data.meta;
  }
}
