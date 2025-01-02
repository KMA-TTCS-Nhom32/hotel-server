import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsDate, IsEnum, ValidateNested } from 'class-validator';
import { UserGender } from '@prisma/client';
import { Image } from '../../images/models/image.model';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    type: String,
    description: 'Full name of the user',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    type: Image,
    description: 'Avatar of the user',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Image)
  avatar?: Image;

  @ApiPropertyOptional({
    type: Date,
    description: 'Birth date of the user',
    example: '20-05-2002',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birth_date?: Date;

  @ApiPropertyOptional({
    enum: UserGender,
    example: UserGender.MALE,
    description: 'User gender',
    type: String,
  })
  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender;

  @ApiPropertyOptional({
    example: 'sondoannam202@gmail.com',
    description: 'User email',
    type: String,
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    example: '0123456789',
    description: 'User phone number',
    type: String,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
