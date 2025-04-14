import { ApiProperty } from '@nestjs/swagger';
import { Language } from '@prisma/client';

export class PromotionTranslation {
  @ApiProperty({ description: 'Unique identifier for the translation' })
  id: string;

  @ApiProperty({ description: 'ID of the room promotion this translation belongs to' })
  roomPromotionId: string;

  @ApiProperty({
    description: 'Language of this translation',
    enum: Language,
    example: Language.EN,
  })
  language: Language;

  @ApiProperty({
    description: 'Translated description of the promotion',
    example: 'Special summer discount for all luxury rooms',
  })
  description: string;
}
