/*
  Warnings:

  - The values [PAID,WAITING_FOR_REFUND] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `services` on the `HotelRoom` table. All the data in the column will be lost.
  - You are about to drop the `Service` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `number_of_guests` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumbnail` to the `HotelBranch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumbnail` to the `HotelRoom` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AmenityType" AS ENUM ('ROOM', 'PROPERTY', 'SERVICE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RoomPriceType" AS ENUM ('PER_HOUR', 'PER_NIGHT');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('PENDING', 'WAITING_FOR_CHECK_IN', 'CHECKED_IN', 'CANCELLED', 'COMPLETED', 'REFUNDED', 'REJECTED');
ALTER TABLE "Booking" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Booking" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "BookingStatus_old";
ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "check_in_time" TIMESTAMP(3),
ADD COLUMN     "check_out_time" TIMESTAMP(3),
ADD COLUMN     "guest_details" JSONB,
ADD COLUMN     "is_business_trip" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "number_of_guests" INTEGER NOT NULL,
ADD COLUMN     "payment_details" JSONB,
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "special_requests" TEXT;

-- AlterTable
ALTER TABLE "HotelBranch" ADD COLUMN     "images" JSONB[],
ADD COLUMN     "thumbnail" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "HotelRoom" DROP COLUMN "services",
ADD COLUMN     "images" JSONB[],
ADD COLUMN     "max_adults" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "max_children" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "thumbnail" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "loyalty_points" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "Service";

-- DropEnum
DROP TYPE "ServiceType";

-- CreateTable
CREATE TABLE "Amenity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "type" "AmenityType" NOT NULL,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomPriceHistory" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "price_type" "RoomPriceType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomPromotion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DOUBLE PRECISION NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "min_nights" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferred_payment_method" "PaymentMethod",
    "special_requirements" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_HotelRoomToRoomPromotion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_UserFavoriteRooms" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AmenityToHotelRoom" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AmenityToHotelBranch" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomPromotion_code_key" ON "RoomPromotion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "_HotelRoomToRoomPromotion_AB_unique" ON "_HotelRoomToRoomPromotion"("A", "B");

-- CreateIndex
CREATE INDEX "_HotelRoomToRoomPromotion_B_index" ON "_HotelRoomToRoomPromotion"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_UserFavoriteRooms_AB_unique" ON "_UserFavoriteRooms"("A", "B");

-- CreateIndex
CREATE INDEX "_UserFavoriteRooms_B_index" ON "_UserFavoriteRooms"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AmenityToHotelRoom_AB_unique" ON "_AmenityToHotelRoom"("A", "B");

-- CreateIndex
CREATE INDEX "_AmenityToHotelRoom_B_index" ON "_AmenityToHotelRoom"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AmenityToHotelBranch_AB_unique" ON "_AmenityToHotelBranch"("A", "B");

-- CreateIndex
CREATE INDEX "_AmenityToHotelBranch_B_index" ON "_AmenityToHotelBranch"("B");

-- AddForeignKey
ALTER TABLE "RoomPriceHistory" ADD CONSTRAINT "RoomPriceHistory_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "HotelRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HotelRoomToRoomPromotion" ADD CONSTRAINT "_HotelRoomToRoomPromotion_A_fkey" FOREIGN KEY ("A") REFERENCES "HotelRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HotelRoomToRoomPromotion" ADD CONSTRAINT "_HotelRoomToRoomPromotion_B_fkey" FOREIGN KEY ("B") REFERENCES "RoomPromotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFavoriteRooms" ADD CONSTRAINT "_UserFavoriteRooms_A_fkey" FOREIGN KEY ("A") REFERENCES "HotelRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFavoriteRooms" ADD CONSTRAINT "_UserFavoriteRooms_B_fkey" FOREIGN KEY ("B") REFERENCES "UserPreference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AmenityToHotelRoom" ADD CONSTRAINT "_AmenityToHotelRoom_A_fkey" FOREIGN KEY ("A") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AmenityToHotelRoom" ADD CONSTRAINT "_AmenityToHotelRoom_B_fkey" FOREIGN KEY ("B") REFERENCES "HotelRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AmenityToHotelBranch" ADD CONSTRAINT "_AmenityToHotelBranch_A_fkey" FOREIGN KEY ("A") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AmenityToHotelBranch" ADD CONSTRAINT "_AmenityToHotelBranch_B_fkey" FOREIGN KEY ("B") REFERENCES "HotelBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
