import {
  Amenity,
  HotelRoom,
  RoomDetail,
  RoomDetailTranslation,
  RoomPriceHistory,
  RoomPromotion,
} from '@prisma/client';

export type PrismaRoomDetail = RoomDetail & {
  translations: RoomDetailTranslation[];
  amenities: Amenity[];
  roomPriceHistories: RoomPriceHistory[];
  promotions: RoomPromotion[];
};

export type PrismaRoomDetailWithList = PrismaRoomDetail & {
  flat_rooms: HotelRoom[];
};
