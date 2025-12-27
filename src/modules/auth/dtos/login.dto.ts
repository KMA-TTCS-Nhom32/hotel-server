import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { AuthErrorMessageEnum } from 'libs/common/enums';
import { Sanitize } from '@/common/decorators';

export class LoginDto {
  @ApiProperty({
    example: 'sondoannam202@gmail.com',
    description: "The user's email address or phone number.",
    type: String,
  })
  @Sanitize()
  @IsString()
  @IsNotEmpty()
  @Matches(/^([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})$|^(\+?\d{10,12})$/, {
    message: AuthErrorMessageEnum.InvalidEmailOrPhone,
  })
  emailOrPhone: string;

  @ApiProperty({
    example: 'password-will-secret',
    description: "The user's password.",
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
