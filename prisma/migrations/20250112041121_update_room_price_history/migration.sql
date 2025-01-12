/*
  Warnings:

  - Added the required column `description` to the `RoomPriceHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `RoomPriceHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RoomPriceHistory" ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;
