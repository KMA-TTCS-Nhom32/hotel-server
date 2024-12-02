/*
  Warnings:

  - Added the required column `provinceId` to the `HotelBranch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HotelBranch" ADD COLUMN     "provinceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "_AmenityToHotelBranch" ADD CONSTRAINT "_AmenityToHotelBranch_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_AmenityToHotelBranch_AB_unique";

-- AlterTable
ALTER TABLE "_AmenityToHotelRoom" ADD CONSTRAINT "_AmenityToHotelRoom_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_AmenityToHotelRoom_AB_unique";

-- AlterTable
ALTER TABLE "_HotelRoomToRoomPromotion" ADD CONSTRAINT "_HotelRoomToRoomPromotion_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_HotelRoomToRoomPromotion_AB_unique";

-- AlterTable
ALTER TABLE "_UserFavoriteRooms" ADD CONSTRAINT "_UserFavoriteRooms_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_UserFavoriteRooms_AB_unique";

-- CreateTable
CREATE TABLE "Province" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zip_code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Province_name_zip_code_key" ON "Province"("name", "zip_code");

-- AddForeignKey
ALTER TABLE "HotelBranch" ADD CONSTRAINT "HotelBranch_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
