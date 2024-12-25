/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `HotelBranch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `HotelRoom` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "HotelBranch" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "HotelRoom" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_code_key" ON "Booking"("code");
