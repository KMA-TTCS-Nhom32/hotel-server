/*
  Warnings:

  - You are about to drop the column `slug` on the `AmenityTranslation` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `HotelBranchTranslation` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `HotelRoomTranslation` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `ProvinceTranslation` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `RoomDetailTranslation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AmenityTranslation" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "HotelBranchTranslation" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "HotelRoomTranslation" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "ProvinceTranslation" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "RoomDetailTranslation" DROP COLUMN "slug";
