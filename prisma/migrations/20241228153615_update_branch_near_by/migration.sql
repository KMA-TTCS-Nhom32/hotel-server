-- AlterTable
ALTER TABLE "HotelBranch" ADD COLUMN     "nearBy" JSONB[] DEFAULT ARRAY[]::JSONB[];
