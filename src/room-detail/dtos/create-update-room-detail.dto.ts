import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsEnum, IsInt, Min, IsArray } from 'class-validator';
import { HotelRoomType, HotelRoomBedType } from '@prisma/client';

export class CreateRoomDetailDto {
  @ApiProperty({ example: 'Deluxe Room' })
  @IsString()
  name: string;

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

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class UpdateRoomDetailDto extends PartialType(CreateRoomDetailDto) {}
