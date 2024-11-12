import { ApiProperty } from '@nestjs/swagger';

export class Image {
  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    description: "The image's URL.",
    type: String,
  })
  url: string;

  @ApiProperty({
    example: 'sample-Id-goes-here',
    description: "The image's public ID in Cloudinary.",
    type: String,
  })
  publicId: string;
}
