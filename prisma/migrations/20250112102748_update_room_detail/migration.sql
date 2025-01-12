/*
  Warnings:

  - Added the required column `area` to the `RoomDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RoomDetail" ADD COLUMN     "area" INTEGER NOT NULL;
