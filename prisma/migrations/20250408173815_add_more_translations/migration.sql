/*
  Warnings:

  - Added the required column `description` to the `RoomPromotion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RoomPromotion" ADD COLUMN     "description" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "RoomPriceHistoryTranslation" (
    "id" TEXT NOT NULL,
    "roomPriceHistoryId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "RoomPriceHistoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionTranslation" (
    "id" TEXT NOT NULL,
    "roomPromotionId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "PromotionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomPriceHistoryTranslation_roomPriceHistoryId_language_key" ON "RoomPriceHistoryTranslation"("roomPriceHistoryId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionTranslation_roomPromotionId_language_key" ON "PromotionTranslation"("roomPromotionId", "language");

-- AddForeignKey
ALTER TABLE "RoomPriceHistoryTranslation" ADD CONSTRAINT "RoomPriceHistoryTranslation_roomPriceHistoryId_fkey" FOREIGN KEY ("roomPriceHistoryId") REFERENCES "RoomPriceHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionTranslation" ADD CONSTRAINT "PromotionTranslation_roomPromotionId_fkey" FOREIGN KEY ("roomPromotionId") REFERENCES "RoomPromotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
