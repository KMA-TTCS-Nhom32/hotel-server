import { PaginatedResponse } from 'libs/common/utils/pagination';
import { User } from '../models';
import { ApiProperty } from '@nestjs/swagger';

export class UsersPaginationResultDto implements PaginatedResponse<User> {
  @ApiProperty({
    type: [User]
  })
  data: User[];

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
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };

  constructor(data: PaginatedResponse<User>) {
    this.data = data.data;
    this.meta = data.meta;
  }
}
