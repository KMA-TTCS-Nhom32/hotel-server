import { Image } from '@/modules/images/models';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type as TransformType } from 'class-transformer';

export class CreateBranchDto {
  @ApiProperty({
    example: { url: 'thumbnail-url', publicId: 'thumbnail-public-id' },
    description: "The branch's thumbnail image.",
    type: Image,
  })
  @IsNotEmpty()
  @ValidateNested()
  @TransformType(() => Image)
  thumbnail: Image;

  @ApiProperty({
    example: [{ url: 'image-url-1', publicId: 'public-id-1' }],
    description: "The branch's images.",
    type: [Image],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @TransformType(() => Image)
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

  @ApiProperty({
    example: { latitude: 10.762622, longitude: 106.660172 },
    description: "The branch's location (latitude and longitude).",
    type: Object,
  })
  @IsNotEmpty()
  location: object;

  @ApiProperty({
    example: 4.5,
    description: "The branch's rating.",
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  rating: number;
}
