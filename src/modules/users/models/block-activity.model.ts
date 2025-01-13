import { ApiProperty } from '@nestjs/swagger';
import { AbstractModel, Nullable } from 'libs/common';
import { User } from './user.model';
import { BlockAction } from '@prisma/client';

export class BlockActivity extends AbstractModel {
  constructor(data: Nullable<BlockActivity>) {
    super();
    Object.assign(this, data);
  }

  @ApiProperty({
    type: String,
    description: 'ID of user who was blocked/unblocked',
  })
  userId: string;

  @ApiProperty({
    type: () => User,
    description: 'Details of user who was blocked/unblocked',
  })
  user?: User;

  @ApiProperty({
    type: String,
    description: 'ID of user who performed the block/unblock action',
  })
  blockedBy: string;

  @ApiProperty({
    type: () => User,
    description: 'Details of user who performed the block/unblock action',
  })
  blockedByUser?: User;

  @ApiProperty({
    enum: BlockAction,
    description: 'Type of action performed (BLOCK/UNBLOCK)',
  })
  action: BlockAction;

  @ApiProperty({
    type: String,
    description: 'Reason for the block/unblock action',
  })
  reason: string;
}
