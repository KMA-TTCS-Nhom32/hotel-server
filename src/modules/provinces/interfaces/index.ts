import { Province, ProvinceTranslation } from '@prisma/client';

export type PrismaProvince = Province & {
  translations: ProvinceTranslation[];
};
