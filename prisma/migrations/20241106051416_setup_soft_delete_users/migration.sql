-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_reason" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
