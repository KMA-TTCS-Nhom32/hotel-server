import { ApiProperty } from '@nestjs/swagger';
import { AmenityType } from '@prisma/client';
import { AbstractModel } from 'libs/common';
import { Image } from '@/modules/images/models';

export class Amenity extends AbstractModel {
  constructor(data: Partial<Amenity>) {
    super();
    Object.assign(this, data);
  }

  @ApiProperty({
    type: String,
    example: 'Swimming Pool',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'swimming-pool',
  })
  slug: string;

  @ApiProperty({
    type: Image,
    nullable: true,
    description: 'Icon image for the amenity',
  })
  icon?: Image;

  @ApiProperty({
    enum: AmenityType,
    example: AmenityType.PROPERTY,
    type: String,
  })
  type: AmenityType;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        language: { type: 'string' },
        name: { type: 'string' },
      },
    },
    description: 'List of translations for the amenity',
  })
  translations: {
    language: string;
    name: string;
  }[];
}
