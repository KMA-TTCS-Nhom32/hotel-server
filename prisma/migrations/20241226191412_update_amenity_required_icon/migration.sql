/*
  Warnings:

  - Made the column `icon` on table `Amenity` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Amenity" ALTER COLUMN "icon" SET NOT NULL;
