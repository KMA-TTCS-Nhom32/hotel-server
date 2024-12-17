/*
  Warnings:

  - You are about to drop the column `bed_type` on the `HotelRoom` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `HotelRoom` table. All the data in the column will be lost.
  - You are about to drop the column `max_adults` on the `HotelRoom` table. All the data in the column will be lost.
  - You are about to drop the column `max_children` on the `HotelRoom` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `HotelRoom` table. All the data in the column will be lost.
  - You are about to drop the column `room_type` on the `HotelRoom` table. All the data in the column will be lost.
  - You are about to drop the `_AmenityToHotelRoom` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,zip_code,slug]` on the table `Province` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `base_price_per_day` to the `HotelRoom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `detailId` to the `HotelRoom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Province` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "BookingType" ADD VALUE 'DAILY';

-- DropForeignKey
ALTER TABLE "_AmenityToHotelRoom" DROP CONSTRAINT "_AmenityToHotelRoom_A_fkey";

-- DropForeignKey
ALTER TABLE "_AmenityToHotelRoom" DROP CONSTRAINT "_AmenityToHotelRoom_B_fkey";

-- DropIndex
DROP INDEX "Province_name_zip_code_key";

-- AlterTable
ALTER TABLE "HotelRoom" DROP COLUMN "bed_type",
DROP COLUMN "description",
DROP COLUMN "max_adults",
DROP COLUMN "max_children",
DROP COLUMN "quantity",
DROP COLUMN "room_type",
ADD COLUMN     "base_price_per_day" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "detailId" TEXT NOT NULL,
ADD COLUMN     "special_price_per_day" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Province" ADD COLUMN     "slug" TEXT NOT NULL;

-- DropTable
DROP TABLE "_AmenityToHotelRoom";

-- CreateTable
CREATE TABLE "RoomDetail" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "room_type" "HotelRoomType" NOT NULL,
    "bed_type" "HotelRoomBedType" NOT NULL,
    "max_adults" INTEGER NOT NULL DEFAULT 2,
    "max_children" INTEGER NOT NULL DEFAULT 2,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AmenityToRoomDetail" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AmenityToRoomDetail_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AmenityToRoomDetail_B_index" ON "_AmenityToRoomDetail"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Province_name_zip_code_slug_key" ON "Province"("name", "zip_code", "slug");

-- AddForeignKey
ALTER TABLE "HotelRoom" ADD CONSTRAINT "HotelRoom_detailId_fkey" FOREIGN KEY ("detailId") REFERENCES "RoomDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AmenityToRoomDetail" ADD CONSTRAINT "_AmenityToRoomDetail_A_fkey" FOREIGN KEY ("A") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AmenityToRoomDetail" ADD CONSTRAINT "_AmenityToRoomDetail_B_fkey" FOREIGN KEY ("B") REFERENCES "RoomDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
