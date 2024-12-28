import { Image } from '@/modules/images/models';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// class LocationDto {
//   @ApiProperty({
//     example: 10.762622,
//     description: 'Latitude coordinate',
//   })
//   @IsNumber()
//   @IsNotEmpty()
//   latitude: number;

//   @ApiProperty({
//     example: 106.660172,
//     description: 'Longitude coordinate',
//   })
//   @IsNumber()
//   @IsNotEmpty()
//   longitude: number;
// }

export class CreateBranchDto {
  @ApiProperty({
    example: 'province-id-123',
    description: 'ID of the province where this branch is located',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  provinceId: string;

  @ApiProperty({
    example: { url: 'thumbnail-url', publicId: 'thumbnail-public-id' },
    description: "The branch's thumbnail image.",
    type: Image,
  })
  @Type(() => Image)
  @IsNotEmpty()
  thumbnail: Image;

  @ApiProperty({
    example: [{ url: 'image-url-1', publicId: 'public-id-1' }],
    description: "The branch's images.",
    type: [Image],
  })
  @ValidateNested({ each: true })
  @Type(() => Image)
  images: Image[];

  @ApiProperty({
    example: 'Branch Name',
    description: "The branch's name.",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'branch-slug',
    description: "The branch's slug.",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({
    example: 'Branch Description',
    description: "The branch's description.",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    example: '0123456789',
    description: "The branch's phone number.",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    example: true,
    description: "The branch's active status.",
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  is_active: boolean;

  @ApiProperty({
    example: 'Branch Address',
    description: "The branch's address.",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  address: string;

//   @ApiProperty({
//     example: { latitude: 10.762622, longitude: 106.660172 },
//     description: "Branch's geographical location",
//     type: LocationDto,
//   })
//   @IsNotEmpty()
//   @ValidateNested()
//   @TransformType(() => LocationDto)
//   location: LocationDto;

  @ApiProperty({
    example: 4.5,
    description: "The branch's rating.",
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  rating: number;
}
