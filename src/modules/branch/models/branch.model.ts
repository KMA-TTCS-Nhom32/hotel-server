import { ApiProperty } from '@nestjs/swagger';
import { Image } from '@/modules/images/models';
import { AbstractModel } from 'libs/common/abstract';
import { Nullable } from 'libs/common/types';

export class Branch extends AbstractModel {
  constructor(data: Nullable<Branch>) {
    super();
    Object.assign(this, data);
  }

  @ApiProperty({
    type: Image,
    description: "Branch's thumbnail image",
  })
  thumbnail: Image;

  @ApiProperty({
    type: [Image],
    description: "Branch's image gallery",
  })
  images: Image[];

  @ApiProperty({
    type: String,
    example: 'Hotel Branch Name',
    description: "Branch's name",
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'Detailed description of the branch',
    description: "Branch's description",
  })
  description: string;

  @ApiProperty({
    type: String,
    example: '0123456789',
    description: "Branch's contact phone number",
  })
  phone: string;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: "Branch's active status",
  })
  is_active: boolean;

  @ApiProperty({
    type: String,
    example: '123 Hotel Street, City',
    description: "Branch's physical address",
  })
  address: string;

  @ApiProperty({
    type: Object,
    example: { latitude: 10.762622, longitude: 106.660172 },
    description: "Branch's geographical location",
  })
  location: { latitude: number; longitude: number };

  @ApiProperty({
    type: Number,
    example: 4.5,
    description: "Branch's rating",
  })
  rating: number;
}
