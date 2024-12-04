import { IsString, IsEnum } from 'class-validator';
import { AccountIdentifier } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVerifyCodeDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  userId: string;
  
  @ApiProperty({
    description: 'Account type',
    example: 'EMAIL',
  })
  @IsEnum(AccountIdentifier)
  type: AccountIdentifier;
}
