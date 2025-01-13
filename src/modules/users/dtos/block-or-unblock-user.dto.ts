import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { BlockAction } from '@prisma/client';

export class BlockOrUnblockUserDto {
  @ApiProperty({
    description: 'The reason for blocking/unblocking the user',
    example: 'Violation of terms of service',
    required: true,
    minLength: 10,
  })
  @IsNotEmpty({ message: 'Reason is required' })
  @IsString({ message: 'Reason must be a string' })
  @MinLength(10, { message: 'Reason must be at least 10 characters long' })
  reason: string;

  @ApiProperty({
    description: 'The action to perform (BLOCK or UNBLOCK)',
    enum: BlockAction,
    example: BlockAction.BLOCK,
    required: true,
  })
  @IsNotEmpty({ message: 'Action is required' })
  @IsString({ message: 'Action must be a string' })
  action: BlockAction;
}
