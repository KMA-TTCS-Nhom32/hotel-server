/*
  Warnings:

  - You are about to drop the column `base_price_per_day` on the `HotelRoom` table. All the data in the column will be lost.
  - You are about to drop the column `base_price_per_hour` on the `HotelRoom` table. All the data in the column will be lost.
  - You are about to drop the column `base_price_per_night` on the `HotelRoom` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `HotelRoom` table. All the data in the column will be lost.
  - You are about to drop the column `images` on the `HotelRoom` table. All the data in the column will be lost.
  - You are about to drop the column `special_price_per_day` on the `HotelRoom` table. All the data in the column will be lost.
  - You are about to drop the column `special_price_per_hour` on the `HotelRoom` table. All the data in the column will be lost.
  - You are about to drop the column `special_price_per_night` on the `HotelRoom` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail` on the `HotelRoom` table. All the data in the column will be lost.
  - You are about to drop the column `roomId` on the `RoomPriceHistory` table. All the data in the column will be lost.
  - You are about to drop the `_HotelRoomToRoomPromotion` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `base_price_per_day` to the `RoomDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `base_price_per_hour` to the `RoomDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `base_price_per_night` to the `RoomDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branchId` to the `RoomDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `RoomDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumbnail` to the `RoomDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomDetailId` to the `RoomPriceHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `applied_type` to the `RoomPromotion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "HotelRoom" DROP CONSTRAINT "HotelRoom_branchId_fkey";

-- DropForeignKey
ALTER TABLE "RoomPriceHistory" DROP CONSTRAINT "RoomPriceHistory_roomId_fkey";

-- DropForeignKey
ALTER TABLE "_HotelRoomToRoomPromotion" DROP CONSTRAINT "_HotelRoomToRoomPromotion_A_fkey";

-- DropForeignKey
ALTER TABLE "_HotelRoomToRoomPromotion" DROP CONSTRAINT "_HotelRoomToRoomPromotion_B_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "adults" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "children" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "infants" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "HotelRoom" DROP COLUMN "base_price_per_day",
DROP COLUMN "base_price_per_hour",
DROP COLUMN "base_price_per_night",
DROP COLUMN "branchId",
DROP COLUMN "images",
DROP COLUMN "special_price_per_day",
DROP COLUMN "special_price_per_hour",
DROP COLUMN "special_price_per_night",
DROP COLUMN "thumbnail";

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "rating_services" DROP DEFAULT,
ALTER COLUMN "rating_cleanliness" DROP DEFAULT,
ALTER COLUMN "rating_comfort" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RoomDetail" ADD COLUMN     "base_price_per_day" DECIMAL(9,0) NOT NULL,
ADD COLUMN     "base_price_per_hour" DECIMAL(9,0) NOT NULL,
ADD COLUMN     "base_price_per_night" DECIMAL(9,0) NOT NULL,
ADD COLUMN     "branchId" TEXT NOT NULL,
ADD COLUMN     "images" JSONB[],
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "special_price_per_day" DECIMAL(9,0) DEFAULT 0,
ADD COLUMN     "special_price_per_hour" DECIMAL(9,0) DEFAULT 0,
ADD COLUMN     "special_price_per_night" DECIMAL(9,0) DEFAULT 0,
ADD COLUMN     "thumbnail" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "RoomPriceHistory" DROP COLUMN "roomId",
ADD COLUMN     "roomDetailId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RoomPromotion" ADD COLUMN     "applied_type" "BookingType" NOT NULL,
ADD COLUMN     "min_days" INTEGER,
ADD COLUMN     "min_hours" INTEGER;

-- DropTable
DROP TABLE "_HotelRoomToRoomPromotion";

-- CreateTable
CREATE TABLE "_RoomDetailToRoomPromotion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RoomDetailToRoomPromotion_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RoomDetailToRoomPromotion_B_index" ON "_RoomDetailToRoomPromotion"("B");

-- AddForeignKey
ALTER TABLE "RoomDetail" ADD CONSTRAINT "RoomDetail_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "HotelBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomPriceHistory" ADD CONSTRAINT "RoomPriceHistory_roomDetailId_fkey" FOREIGN KEY ("roomDetailId") REFERENCES "RoomDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoomDetailToRoomPromotion" ADD CONSTRAINT "_RoomDetailToRoomPromotion_A_fkey" FOREIGN KEY ("A") REFERENCES "RoomDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoomDetailToRoomPromotion" ADD CONSTRAINT "_RoomDetailToRoomPromotion_B_fkey" FOREIGN KEY ("B") REFERENCES "RoomPromotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
