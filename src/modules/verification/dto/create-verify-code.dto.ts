import { IsString, IsEnum } from 'class-validator';
import { AccountIdentifier } from '@prisma/client';

export class CreateVerifyCodeDto {
  @IsString()
  userId: string;

  @IsEnum(AccountIdentifier)
  type: AccountIdentifier;
}
