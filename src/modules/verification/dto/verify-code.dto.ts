import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { CreateVerifyCodeDto } from './create-verify-code.dto';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyCodeDto extends CreateVerifyCodeDto {
  @ApiProperty({
    description: 'Verification code',
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class VerifyEmailOTP {
  @ApiProperty({
    description: 'Email',
    example: 'sondoannam202@gmail.com',
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Verification code',
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  code: string;
}
