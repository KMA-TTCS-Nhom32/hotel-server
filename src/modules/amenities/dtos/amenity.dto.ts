import { ApiProperty, PartialType } from '@nestjs/swagger';
import { AmenityType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateAmenityDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ enum: AmenityType })
  @IsEnum(AmenityType)
  type: AmenityType;
}

export class AmenityResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ nullable: true })
  icon?: {
    publicId: string;
    url: string;
  };

  @ApiProperty({ enum: AmenityType })
  type: AmenityType;
}

export class UpdateAmenityDto extends PartialType(CreateAmenityDto) {}