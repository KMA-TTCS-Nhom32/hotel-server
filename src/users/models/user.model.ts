import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { AbstractModel } from 'libs/common/abstract';
import { Nullable } from 'libs/common/types';

export class User extends AbstractModel {
  constructor(data: Nullable<User>) {
    super();
    Object.assign(this, data);
  }

  @ApiProperty({
    type: String,
    example: 'sondoannam202@gmail.com',
  })
  email: string;

  @ApiProperty({
    type: String,
    example: '0123456789',
  })
  phone: string;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  verified_email: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  verified_phone: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  is_blocked: boolean;

  @ApiProperty({
    type: String,
    example: 'Nam Son',
  })
  name?: string;

  @ApiProperty({
    example: UserRole.USER,
    enum: UserRole,
    type: String,
  })
  role: UserRole;
}
