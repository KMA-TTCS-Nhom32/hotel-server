import { Amenity, AmenityTranslation } from '@prisma/client';

export type PrismaAmenity = Amenity & {
  translations: AmenityTranslation[];
};
