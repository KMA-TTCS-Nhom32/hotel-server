import { IsEmail, IsString, MinLength, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Sanitize } from '@/common/decorators';

/**
 * Password complexity regex - same as CreateUserDto
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const PASSWORD_MESSAGE =
  'Password must be at least 8 characters and contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character (@$!%*?&)';

export class InitiateForgotPasswordEmailDto {
  @ApiProperty({
    description: 'Email address of the user who forgot their password',
    example: 'user@example.com',
  })
  @Sanitize()
  @IsEmail()
  email: string;
}

export class ResetPasswordWithOTPEmailDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  @Sanitize()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Six digit verification code sent to email',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @Sanitize()
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({
    description: 'New password to set',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword: string;
}
