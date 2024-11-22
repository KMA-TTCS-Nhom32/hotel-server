import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';

export class RegisterVerificationEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address to send verification code',
  })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    example: '123456',
    description: 'Verification code to be sent',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'en',
    description: 'Language for email template',
    enum: ['en', 'vi'],
    default: 'en',
    required: false,
  })
  @IsOptional()
  @IsIn(['en', 'vi'])
  lang?: 'en' | 'vi' = 'en';
}
