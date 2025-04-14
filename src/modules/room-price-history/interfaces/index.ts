import { RoomPriceHistory, RoomPriceHistoryTranslation } from '@prisma/client';

export type PrismaRoomPriceHistory = RoomPriceHistory & {
  translations: RoomPriceHistoryTranslation[];
};
