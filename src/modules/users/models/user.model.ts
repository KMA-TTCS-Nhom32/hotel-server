import { Booking } from '@/modules/booking/models';
import { Branch } from '@/modules/branch/models';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountIdentifier, UserGender, UserRole } from '@prisma/client';
import { IsDate, IsEnum } from 'class-validator';

import { AbstractModel } from 'libs/common/abstract';
import { Nullable } from 'libs/common/types';
import { BlockActivity } from './block-activity.model';
import { Image } from '@/modules/images/models';

export class User extends AbstractModel {
  constructor(data: Nullable<User>) {
    super();
    Object.assign(this, data);
  }

  @ApiProperty({
    type: String,
    example: 'Nam Son',
  })
  name: string;

  @ApiProperty({
    type: String || null,
    example: 'sondoannam202@gmail.com',
  })
  email: string | null;

  @ApiProperty({
    type: String || null,
    example: '0123456789',
  })
  phone: string | null;

  @ApiPropertyOptional({
    type: Date,
    example: '20-05-2002',
    description: 'The user birth date',
  })
  @IsDate()
  birth_date?: Date;

  @ApiPropertyOptional({
    type: String,
    enum: UserGender,
    example: UserGender.FEMALE,
  })
  @IsEnum(UserGender)
  gender?: UserGender;

  @ApiPropertyOptional({
    type: Image,
    description: 'User avatar',
  })
  avatar: Image;

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
    enum: AccountIdentifier,
    example: AccountIdentifier.EMAIL,
    type: String,
  })
  identifier_type: AccountIdentifier;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  is_blocked: boolean;

  @ApiProperty({
    example: UserRole.USER,
    enum: UserRole,
    type: String,
  })
  role: UserRole;
}

export class UserDetail extends User {
  constructor(data: UserDetail) {
    super(data);
    Object.assign(this, data);
  }

  @ApiPropertyOptional({
    type: Date,
    description: 'Date when user was blocked',
  })
  blocked_at?: Date;

  @ApiPropertyOptional({
    type: String,
    description: 'Reason for blocking the user',
  })
  blocked_reason?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Reason for deleting the user',
  })
  deleted_reason?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Stored identity (email/phone) before deletion',
  })
  deleted_identity?: string;

  @ApiProperty({
    type: Boolean,
    description: 'Whether the user is active',
    default: true,
  })
  is_active: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'ID of the branch where user works (for staff)',
  })
  branchId?: string;

  @ApiPropertyOptional({
    type: () => Branch,
    description: 'Branch details where user works',
  })
  working_at?: Branch;

  @ApiProperty({
    type: [Booking],
    description: 'User bookings history',
  })
  bookings: Booking[];

  @ApiProperty({
    type: Number,
    description: 'User loyalty points',
    default: 0,
  })
  loyalty_points: number;

  @ApiProperty({
    type: [BlockActivity],
    description: 'History of blocks received by user',
  })
  blockHistory: BlockActivity[];

  @ApiProperty({
    type: [BlockActivity],
    description: 'History of blocks given by user',
  })
  blockedByMe: BlockActivity[];
}
