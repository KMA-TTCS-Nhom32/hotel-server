/*
  Warnings:

  - You are about to drop the column `deleted` on the `RoomPromotion` table. All the data in the column will be lost.
  - The `isDeleted` column on the `RoomPromotion` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "RoomPromotion" DROP COLUMN "deleted",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "isDeleted",
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
