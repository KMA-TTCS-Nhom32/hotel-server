import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Language } from '@prisma/client';

export class RoomDetailTranslationDto {
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
    description: 'Translated name of the room detail',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
    example: 'Spacious room with city view',
    description: 'Translated description of the room detail',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class UpdateRoomDetailTranslationDto extends RoomDetailTranslationDto {
  @ApiProperty({
    type: String,
    example: 'room-detail-id-123',
    description: 'ID of the room detail',
  })
  @IsString()
  @IsNotEmpty()
  roomDetailId: string;
}
