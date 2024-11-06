-- CreateEnum
CREATE TYPE "AccountIdentifier" AS ENUM ('EMAIL', 'PHONE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "identifier_type" "AccountIdentifier" NOT NULL DEFAULT 'EMAIL';
