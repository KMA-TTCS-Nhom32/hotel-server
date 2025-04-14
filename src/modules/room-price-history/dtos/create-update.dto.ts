import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDecimal,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import Decimal from 'decimal.js';
import { RoomPriceHistoryTranslationDto } from './translation.dto';

export class CreateRoomPriceHistoryDto {
  @ApiProperty({
    type: String,
    example: 'Quoc Khanh',
    description: 'Day that the price is applied',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Ap dung vao ngay le quoc khanh 2/9',
    description: 'Description of the price history',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: String,
    example: 'detail-id-123',
    description: 'ID of the room detail',
  })
  @IsString()
  @IsNotEmpty()
  roomDetailId: string;

  @ApiPropertyOptional({
    type: String,
    example: '300000',
    description: "Hotel Room's base price per hour",
  })
  @IsOptional()
  @IsDecimal()
  price_per_hour: Decimal;

  @ApiPropertyOptional({
    type: String,
    example: '500000',
    description: "Hotel Room's base price per day",
  })
  @IsOptional()
  @IsDecimal()
  price_per_day: Decimal;

  @ApiPropertyOptional({
    type: String,
    example: '1000000',
    description: "Hotel Room's base price per night",
  })
  @IsOptional()
  @IsDecimal()
  price_per_night: Decimal;

  @ApiProperty({
    type: String,
    example: '02-09',
    description: 'Effective from date',
  })
  @IsNotEmpty()
  @IsString()
  effective_from: string;

  @ApiPropertyOptional({
    type: String,
    example: '02-09',
    description: 'Effective to date',
  })
  @IsOptional()
  @IsString()
  effective_to?: string;

  @ApiPropertyOptional({
    type: [RoomPriceHistoryTranslationDto],
    description: 'Translations for the price history',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomPriceHistoryTranslationDto)
  translations?: RoomPriceHistoryTranslationDto[];
}

export class UpdateRoomPriceHistoryDto extends PartialType(
  OmitType(CreateRoomPriceHistoryDto, ['roomDetailId']),
) {}
