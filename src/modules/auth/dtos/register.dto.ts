import { CreateUserDto } from '@/modules/users/dtos';
import { ApiProperty } from '@nestjs/swagger';
import { AccountIdentifier } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    type: CreateUserDto,
  })
  data: CreateUserDto;

  @ApiProperty({
    example: 'EMAIL',
    type: String,
    enum: AccountIdentifier,
    default: AccountIdentifier.EMAIL,
  })
  @IsEnum(AccountIdentifier)
  @IsOptional()
  accountIdentifier?: AccountIdentifier;
}
