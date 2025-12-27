import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { Sanitize } from '@/common/decorators';

/**
 * Password complexity regex:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character (@$!%*?&)
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const PASSWORD_MESSAGE =
  'Password must be at least 8 characters and contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character (@$!%*?&)';

export class CreateUserDto {
  @ApiProperty({
    example: 'sondoannam202@gmail.com',
    description: "The user's email address.",
    type: String,
    required: false,
  })
  @IsOptional()
  @Sanitize()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '0123456789',
    description: "The user's phone number.",
    type: String,
    required: false,
  })
  @IsOptional()
  @Sanitize()
  @IsString()
  @MinLength(10)
  @MaxLength(12)
  phone?: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description:
      "The user's password. Must contain uppercase, lowercase, number, and special character.",
    minLength: 8,
    type: String,
  })
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;

  @ApiProperty({
    example: 'Nam Son',
    description: "The user's name.",
    required: true,
    type: String,
  })
  @Sanitize()
  @IsNotEmpty()
  @IsString()
  name: string;

  // @ApiProperty({
  //     description: "The user's role.",
  //     required: true,
  //     enum: UserRole,
  //     example: UserRole.USER,
  //     type: String,
  // })
  // @IsNotEmpty()
  // @IsEnum(UserRole)
  // role: UserRole;
}
