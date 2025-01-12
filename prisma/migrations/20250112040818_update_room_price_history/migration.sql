/*
  Warnings:

  - You are about to alter the column `price` on the `RoomPriceHistory` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(9,0)`.
  - Added the required column `updatedAt` to the `RoomPriceHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RoomPriceHistory" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(9,0),
ALTER COLUMN "effective_from" SET DATA TYPE TEXT,
ALTER COLUMN "effective_to" SET DATA TYPE TEXT;
