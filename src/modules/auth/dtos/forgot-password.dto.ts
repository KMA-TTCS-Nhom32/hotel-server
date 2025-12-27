import { IsEmail, IsString, MinLength, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateForgotPasswordEmailDto {
  @ApiProperty({
    description: 'Email address of the user who forgot their password',
    example: 'user@example.com'
  })
  @IsEmail()
  email: string;
}

export class VerifyForgotPasswordOTPDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Six digit verification code sent to email',
    example: '123456',
    minLength: 6,
    maxLength: 6
  })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class ResetPasswordWithOTPEmailDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Six digit verification code sent to email',
    example: '123456',
    minLength: 6,
    maxLength: 6
  })
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({
    description: 'New password to set',
    example: 'newPassword123',
    minLength: 8
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
