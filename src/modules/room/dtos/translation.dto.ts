import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Language } from '@prisma/client';

export class HotelRoomTranslationDto {
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
    example: 'Deluxe Room',
    description: 'Translated name of the room',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateHotelRoomTranslationDto extends HotelRoomTranslationDto {
  @ApiProperty({
    type: String,
    example: 'room-id-123',
    description: 'ID of the hotel room',
  })
  @IsString()
  @IsNotEmpty()
  roomId: string;
}
