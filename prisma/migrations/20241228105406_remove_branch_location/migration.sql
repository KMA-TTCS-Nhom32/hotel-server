-- AlterTable
ALTER TABLE "HotelBranch" ALTER COLUMN "location" DROP NOT NULL,
ALTER COLUMN "location" SET DEFAULT '{ "latitude": "0", "longitude": "0" }';
