import { PromotionTranslation, RoomPromotion } from '@prisma/client';

export interface PrismaRoomPromotion extends RoomPromotion {
  translations: PromotionTranslation[];
}
