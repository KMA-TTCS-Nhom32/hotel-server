/*
  Warnings:

  - You are about to drop the column `endDate` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `Booking` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email,phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `end_date` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_amount` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "endDate",
DROP COLUMN "endTime",
DROP COLUMN "paymentMethod",
DROP COLUMN "startDate",
DROP COLUMN "startTime",
DROP COLUMN "totalAmount",
ADD COLUMN     "cancel_reason" TEXT,
ADD COLUMN     "end_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "end_time" TIMESTAMP(3),
ADD COLUMN     "payment_method" "PaymentMethod",
ADD COLUMN     "start_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "start_time" TIMESTAMP(3),
ADD COLUMN     "total_amount" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_phone_key" ON "User"("email", "phone");
