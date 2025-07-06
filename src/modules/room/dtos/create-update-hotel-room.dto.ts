import { HotelRoomStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { HotelRoomTranslationDto } from './translation.dto';

export class CreateHotelRoomDto {
  @ApiProperty({
    type: String,
    example: 'Deluxe Room',
    description: "Hotel Room's name",
  })
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
    enum: HotelRoomStatus,
    example: HotelRoomStatus.AVAILABLE,
    description: "Hotel Room's status",
  })
  @IsEnum(HotelRoomStatus)
  @IsNotEmpty()
  status: HotelRoomStatus;

  @ApiProperty({
    type: String,
    example: 'detail-id-123',
    description: 'ID of the room detail',
  })
  @IsString()
  @IsNotEmpty()
  detailId: string;

  @ApiPropertyOptional({
    type: [HotelRoomTranslationDto],
    description: 'Translations for the hotel room',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HotelRoomTranslationDto)
  translations?: HotelRoomTranslationDto[];
}

export class UpdateHotelRoomDto extends PartialType(OmitType(CreateHotelRoomDto, ['detailId'])) {}
