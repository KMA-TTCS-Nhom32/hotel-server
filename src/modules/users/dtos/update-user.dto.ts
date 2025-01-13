import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserGender } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  Validate,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { CommonErrorMessagesEnum } from 'libs/common/enums';

export class UpdateUserDto {
  @ApiProperty({
    example: 'sondoannam202@gmail.com',
    description: "The user's email address.",
    type: String,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '0123456789',
    description: "The user's phone number.",
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(10, {
    message: CommonErrorMessagesEnum.PhoneLengthError,
  })
  @MaxLength(12, {
    message: CommonErrorMessagesEnum.PhoneLengthError,
  })
  @Matches(/^[0-9]+$/, {
    message: CommonErrorMessagesEnum.InvalidPhoneFormat,
  })
  phone?: string;

  @ApiProperty({
    example: 'Nam Son',
    description: "The user's name.",
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, {
    message: CommonErrorMessagesEnum.NameTooShort,
  })
  @MaxLength(50, {
    message: CommonErrorMessagesEnum.NameTooLong,
  })
  name?: string;

  @ApiProperty({
    description: "The user's avatar URL.",
    type: String,
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\/.+/, {
    message: CommonErrorMessagesEnum.InvalidAvatarUrl,
  })
  avatar_url?: string;

  @ApiProperty({
    description: "The user's gender.",
    enum: UserGender,
    example: UserGender.MALE,
    type: String,
  })
  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender;

  @ApiProperty({
    description: "The user's birth date. Not less than 1900.",
    type: String,
    example: '2002-05-20',
  })
  @IsOptional()
  @IsDateString()
  @Validate(
    (value: string) => {
      const date = new Date(value);
      return date.getFullYear() >= 1900;
    },
    {
      message: 'Birth date year must not be less than 1900',
    },
  )
  birth_date?: string;
}

export class AdminUpdateUserDto {
  @ApiProperty({
    description: "The user's role.",
    required: true,
    enum: UserRole,
    example: UserRole.ADMIN,
    type: String,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    type: String,
    example: 'branchId',
    description: 'Filter by branch ID',
  })
  @IsOptional()
  @IsString()
  branchId?: string;
}
