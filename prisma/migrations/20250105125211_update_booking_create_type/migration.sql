/*
  Warnings:

  - You are about to alter the column `total_amount` on the `Booking` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(9,0)`.
  - Added the required column `create_type` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BookingCreateType" AS ENUM ('ONLINE_BOOKING', 'AT_HOTEL');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "create_type" "BookingCreateType" NOT NULL,
ALTER COLUMN "total_amount" SET DATA TYPE DECIMAL(9,0);
