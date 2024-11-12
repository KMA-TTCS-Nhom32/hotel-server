import { CloudinaryResponse } from '@/third-party/cloudinary/cloudinary-response';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ImageUploadResponseDto {
  constructor({ public_id, secure_url }: CloudinaryResponse) {
    this.publicId = public_id;
    this.url = secure_url.replace(/\.png$/, '.webp');
  }

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
