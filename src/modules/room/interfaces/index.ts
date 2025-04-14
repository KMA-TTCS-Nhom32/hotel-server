import { HotelRoom, HotelRoomTranslation } from '@prisma/client';

export type PrismaRoom = HotelRoom & {
  translations: HotelRoomTranslation[];
  _count: {
    bookings: number;
  };
};
