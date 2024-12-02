import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse, PaginationMetaResponse } from 'libs/common/utils';

export class PaginationResultDto<T> {
  @ApiProperty({
    type: [Object],
  })
  data: T[];

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

  constructor(data: PaginatedResponse<T>) {
    this.data = data.data;
    this.meta = data.meta;
  }
}
