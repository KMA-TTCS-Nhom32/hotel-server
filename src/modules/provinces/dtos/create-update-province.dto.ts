import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateProvinceDto {
  @ApiProperty({
    example: 'Ha Noi',
    description: 'Name of the province',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: '100000',
    description: 'ZIP/Postal code of the province',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{5,6}$/, {
    message: 'ZIP code must be 5-6 digits',
  })
  zip_code: string;

  @ApiProperty({
    example: 'ha-noi',
    description: 'URL-friendly slug of the province name',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with optional hyphens',
  })
  slug: string;
}

export class UpdateProvinceDto extends PartialType(CreateProvinceDto) {}
