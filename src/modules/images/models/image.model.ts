import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class Image {
  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    description: "The image's URL.",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  url: string;

  @ApiProperty({
    example: 'sample-Id-goes-here',
    description: "The image's public ID in Cloudinary.",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  publicId: string;
}
