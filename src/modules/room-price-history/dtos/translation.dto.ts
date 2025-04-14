import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Language } from '@prisma/client';

export class RoomPriceHistoryTranslationDto {
  @ApiProperty({
    enum: Language,
    example: Language.EN,
    description: 'Language of the translation',
  })
  @IsEnum(Language)
  @IsNotEmpty()
  language: Language;

  @ApiProperty({
    type: String,
    example: 'National Day',
    description: 'Translated name of the price history',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
    example: 'Special price for National Day holiday',
    description: 'Translated description of the price history',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class UpdateRoomPriceHistoryTranslationDto extends RoomPriceHistoryTranslationDto {
  @ApiProperty({
    type: String,
    example: 'price-history-id-123',
    description: 'ID of the room price history',
  })
  @IsString()
  @IsNotEmpty()
  roomPriceHistoryId: string;
}
