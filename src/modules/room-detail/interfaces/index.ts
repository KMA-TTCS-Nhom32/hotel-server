import {
  Amenity,
  HotelRoom,
  HotelRoomStatus,
  RoomDetail,
  RoomDetailTranslation,
  RoomPriceHistory,
  RoomPromotion,
} from '@prisma/client';

/** Minimal room data needed for availability calculation */
export type RoomForAvailability = {
  id: string;
  status: HotelRoomStatus;
  isDeleted: boolean;
};

export type PrismaRoomDetail = RoomDetail & {
  translations?: RoomDetailTranslation[];
  amenities?: Amenity[];
  roomPriceHistories?: RoomPriceHistory[];
  promotions?: RoomPromotion[];
  flat_rooms?: HotelRoom[] | RoomForAvailability[];
};

export type PrismaRoomDetailWithList = PrismaRoomDetail & {
  flat_rooms: HotelRoom[];
};

/**
 * Options for RoomDetail constructor to pass computed values
 */
export interface RoomDetailConstructorOptions {
  /** Number of rooms available for the requested time slot */
  availableRoomsCount?: number;
}
