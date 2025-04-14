import { PrismaProvince } from '@/modules/provinces/interfaces';
import { Amenity, HotelBranch, HotelBranchTranslation, RoomDetail } from '@prisma/client';

export type PrismaBranch = HotelBranch & {
  translations: HotelBranchTranslation[];
  province: PrismaProvince;
};

export type PrismaBranchDetail = PrismaBranch & {
  amenities: Amenity[];
  rooms: RoomDetail[];
};
