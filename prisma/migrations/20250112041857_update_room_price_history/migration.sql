/*
  Warnings:

  - You are about to drop the column `price` on the `RoomPriceHistory` table. All the data in the column will be lost.
  - You are about to drop the column `price_type` on the `RoomPriceHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RoomPriceHistory" DROP COLUMN "price",
DROP COLUMN "price_type",
ADD COLUMN     "price_per_day" DECIMAL(9,0),
ADD COLUMN     "price_per_hour" DECIMAL(9,0),
ADD COLUMN     "price_per_night" DECIMAL(9,0);
