/*
  Warnings:

  - You are about to drop the column `price` on the `HotelRoom` table. All the data in the column will be lost.
  - Added the required column `totalAmount` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `base_price_per_hour` to the `HotelRoom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `base_price_per_night` to the `HotelRoom` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('HOURLY', 'NIGHTLY');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'PAID', 'WAITING_FOR_REFUND', 'REFUNDED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANKING', 'ZALOPAY', 'MOMO', 'VN_PAY');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "startTime" TIMESTAMP(3),
ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "type" "BookingType" NOT NULL;

-- AlterTable
ALTER TABLE "HotelBranch" ADD COLUMN     "rating" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "HotelRoom" DROP COLUMN "price",
ADD COLUMN     "base_price_per_hour" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "base_price_per_night" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "services" TEXT[],
ADD COLUMN     "special_price_per_hour" DOUBLE PRECISION,
ADD COLUMN     "special_price_per_night" DOUBLE PRECISION,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "rating_services" INTEGER NOT NULL DEFAULT 0,
    "rating_cleanliness" INTEGER NOT NULL DEFAULT 0,
    "rating_comfort" INTEGER NOT NULL DEFAULT 0,
    "is_anonymous_review" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "HotelRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
