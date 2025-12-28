/*
  Warnings:

  - You are about to drop the `_RoomDetailToRoomPromotion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_RoomDetailToRoomPromotion" DROP CONSTRAINT "_RoomDetailToRoomPromotion_A_fkey";

-- DropForeignKey
ALTER TABLE "_RoomDetailToRoomPromotion" DROP CONSTRAINT "_RoomDetailToRoomPromotion_B_fkey";

-- AlterTable
ALTER TABLE "RoomPromotion" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDeleted" TIMESTAMP(3);

-- DropTable
DROP TABLE "_RoomDetailToRoomPromotion";

-- CreateTable
CREATE TABLE "_RoomToPromotion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RoomToPromotion_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RoomToPromotion_B_index" ON "_RoomToPromotion"("B");

-- AddForeignKey
ALTER TABLE "_RoomToPromotion" ADD CONSTRAINT "_RoomToPromotion_A_fkey" FOREIGN KEY ("A") REFERENCES "RoomDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoomToPromotion" ADD CONSTRAINT "_RoomToPromotion_B_fkey" FOREIGN KEY ("B") REFERENCES "RoomPromotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
