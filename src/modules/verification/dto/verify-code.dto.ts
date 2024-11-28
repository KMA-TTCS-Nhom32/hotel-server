import { IsString, Length } from 'class-validator';
import { CreateVerifyCodeDto } from './create-verify-code.dto';

export class VerifyCodeDto extends CreateVerifyCodeDto {
  @IsString()
  @Length(6, 6)
  code: string;
}
