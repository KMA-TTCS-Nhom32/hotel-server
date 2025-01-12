import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsInt,
  Min,
  IsArray,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
  IsDecimal,
} from 'class-validator';
import { HotelRoomType, HotelRoomBedType } from '@prisma/client';
import { Type } from 'class-transformer';
import { Image } from '@/modules/images/models';
import Decimal from 'decimal.js';

export class CreateRoomDetailDto {
  @ApiProperty({ example: 'Deluxe Room' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
    example: 'deluxe-room',
    description: "Hotel Room's slug",
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    type: String,
    example: 'branch-id-123',
    description: 'ID of the branch where this room is located',
  })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({
    type: Image,
    description: "Hotel Room's thumbnail image",
  })
  @ValidateNested()
  @Type(() => Image)
  @IsNotEmpty()
  thumbnail: Image;

  @ApiProperty({
    type: [Image],
    description: "Hotel Room's image gallery",
  })
  @ValidateNested({ each: true })
  @Type(() => Image)
  @IsArray()
  images: Image[];

  @ApiProperty({ example: 'Spacious room with city view' })
  @IsString()
  description: string;

  @ApiProperty({ enum: HotelRoomType })
  @IsEnum(HotelRoomType)
  room_type: HotelRoomType;

  @ApiProperty({ enum: HotelRoomBedType })
  @IsEnum(HotelRoomBedType)
  bed_type: HotelRoomBedType;

  @ApiProperty({ example: ['amenity1-id', 'amenity2-id'] })
  @IsArray()
  @IsString({ each: true })
  amenityIds: string[];

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  max_adults: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(0)
  max_children: number;

  @ApiProperty({
    type: Number,
    example: 25,
    description: 'Room area(m2)',
  })
  @IsInt()
  @Min(1)
  area: number;

  @ApiProperty({
    type: String,
    example: '300000',
    description: "Hotel Room's base price per hour",
  })
  @IsNotEmpty()
  @IsDecimal()
  base_price_per_hour: Decimal;

  @ApiProperty({
    type: String,
    example: '500000',
    description: "Hotel Room's base price per night",
  })
  @IsNotEmpty()
  @IsDecimal()
  base_price_per_night: Decimal;

  @ApiProperty({
    type: String,
    example: '1000000',
    description: "Hotel Room's base price per day",
  })
  @IsNotEmpty()
  @IsDecimal()
  base_price_per_day: Decimal;
}

export class UpdateRoomDetailDto extends PartialType(CreateRoomDetailDto) {
  @ApiPropertyOptional({
    type: [String],
    description: 'Branch amenities',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenityIds?: string[];

  @ApiPropertyOptional({
    type: String,
    example: '200000',
    description: "Hotel Room's special price per hour",
  })
  @IsOptional()
  @IsDecimal()
  special_price_per_hour?: Decimal;

  @ApiPropertyOptional({
    type: String,
    example: '400000',
    description: "Hotel Room's special price per night",
  })
  @IsOptional()
  @IsDecimal()
  special_price_per_night?: Decimal;

  @ApiPropertyOptional({
    type: String,
    example: '900000',
    description: "Hotel Room's special price per day",
  })
  @IsOptional()
  @IsDecimal()
  special_price_per_day?: Decimal;
}
