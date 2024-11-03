import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserGender } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, IsOptional, IsDateString, Validate } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: 'Nam Son',
    description: "The user's name.",
    required: true,
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: "The user's role.",
    required: true,
    enum: UserRole,
    example: UserRole.USER,
    type: String,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: "The user's gender.",
    required: false,
    enum: UserGender,
    example: UserGender.MALE,
    type: String,
  })
  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender;

  // @ApiProperty({
  //     description: "The user's birth date.",
  //     required: false,
  //     type: String,
  //     example: '2002-05-20',
  // })
  // @IsOptional()
  // @IsDateString()
  // birth_date?: string;

  @ApiProperty({
    description: "The user's birth date. Not less than 1900.",
    required: false,
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
}
