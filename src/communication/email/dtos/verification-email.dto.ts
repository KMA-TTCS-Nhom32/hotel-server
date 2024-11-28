import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsIn, IsOptional, IsEnum } from 'class-validator';
import { EmailTemplateType, EmailTypeEnum } from '../types';

export class VerificationEmailDto {
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

  @ApiProperty({
    example: 'register',
    description: 'Type of verification email',
    enum: EmailTypeEnum,
    default: EmailTypeEnum.VERIFY_ACCOUNT,
  })
  @IsIn([EmailTypeEnum.VERIFY_ACCOUNT, EmailTypeEnum.FORGOT_PASSWORD])
  @IsEnum(EmailTypeEnum)
  type: EmailTemplateType = EmailTypeEnum.VERIFY_ACCOUNT;
}
