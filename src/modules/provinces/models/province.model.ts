import { AbstractModel } from 'libs/common';
import { ApiProperty } from '@nestjs/swagger';

export class Province extends AbstractModel {
  constructor(data: Province) {
    super();
    Object.assign(this, data);
  }

  @ApiProperty({
    type: String,
    example: 'Ha Noi',
    description: 'Name of the province',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: '100000',
    description: 'ZIP/Postal code of the province',
  })
  zip_code: string;

  @ApiProperty({
    type: String,
    example: 'hanoi',
    description: 'Slug of the province',
  })
  slug: string;
}
