import { IsString, IsEnum, Length } from 'class-validator';
import { AccountIdentifier } from '@prisma/client';

export class VerifyCodeDto {
  @IsString()
  userId: string;

  @IsString()
  @Length(6, 6)
  code: string;

  @IsEnum(AccountIdentifier)
  type: AccountIdentifier;
}
