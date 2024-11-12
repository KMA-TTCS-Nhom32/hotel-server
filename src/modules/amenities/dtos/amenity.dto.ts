import { ApiProperty, PartialType } from '@nestjs/swagger';
import { AmenityType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { Image } from '@/modules/images/models';

export class CreateAmenityDto {
  @ApiProperty({
    example: 'Swimming Pool',
    description: 'The name of the amenity',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'swimming-pool',
    description: 'URL-friendly version of the name (lowercase, hyphenated)',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase and hyphen-separated',
  })
  @MaxLength(100)
  slug: string;

  @ApiProperty({
    enum: AmenityType,
    example: AmenityType.PROPERTY,
    description: 'Type of amenity (ROOM, PROPERTY, or SERVICE)',
    type: String,
  })
  @IsEnum(AmenityType)
  @IsNotEmpty()
  type: AmenityType;
}

export class AmenityResponseDto {
  @ApiProperty({
    example: 'clh1u2xkg0000qwl305jn1q0x',
    description: 'Unique identifier for the amenity',
  })
  id: string;

  @ApiProperty({
    example: 'Swimming Pool',
    description: 'The name of the amenity',
  })
  name: string;

  @ApiProperty({
    example: 'swimming-pool',
    description: 'URL-friendly version of the name',
  })
  slug: string;

  @ApiProperty({
    type: Image,
    nullable: true,
    description: 'Icon image details',
    example: {
      publicId: 'hotel/amenities/swimming-pool-icon',
      url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'
    }
  })
  icon?: Image;

  @ApiProperty({
    enum: AmenityType,
    example: AmenityType.PROPERTY,
    description: 'Type of amenity',
  })
  type: AmenityType;
}

export class UpdateAmenityDto extends PartialType(CreateAmenityDto) {}