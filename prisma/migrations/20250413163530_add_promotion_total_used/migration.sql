-- AlterTable
ALTER TABLE "RoomPromotion" ADD COLUMN     "total_code" INTEGER,
ADD COLUMN     "total_used" INTEGER NOT NULL DEFAULT 0;
