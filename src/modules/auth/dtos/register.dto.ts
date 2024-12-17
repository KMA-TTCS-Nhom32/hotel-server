import { CreateUserDto } from '@/modules/users/dtos';
import { ApiProperty } from '@nestjs/swagger';
import { AccountIdentifier } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    type: CreateUserDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateUserDto)
  data: CreateUserDto;

  @ApiProperty({
    example: 'EMAIL',
    type: String,
    enum: AccountIdentifier,
    default: AccountIdentifier.EMAIL,
  })
  @IsEnum(AccountIdentifier)
  accountIdentifier: AccountIdentifier = AccountIdentifier.EMAIL;
}
