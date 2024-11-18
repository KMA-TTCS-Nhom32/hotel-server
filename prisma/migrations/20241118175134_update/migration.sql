/*
  Warnings:

  - The `icon` column on the `Amenity` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `Amenity` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `thumbnail` on the `HotelBranch` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `thumbnail` on the `HotelRoom` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Amenity" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "icon",
ADD COLUMN     "icon" JSONB;

-- AlterTable
ALTER TABLE "HotelBranch" DROP COLUMN "thumbnail",
ADD COLUMN     "thumbnail" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "HotelRoom" DROP COLUMN "thumbnail",
ADD COLUMN     "thumbnail" JSONB NOT NULL;
