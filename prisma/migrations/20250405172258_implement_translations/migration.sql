-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'VI');

-- CreateTable
CREATE TABLE "ProvinceTranslation" (
    "id" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "ProvinceTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelBranchTranslation" (
    "id" TEXT NOT NULL,
    "hotelBranchId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "nearBy" JSONB[] DEFAULT ARRAY[]::JSONB[],

    CONSTRAINT "HotelBranchTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelRoomTranslation" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "HotelRoomTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomDetailTranslation" (
    "id" TEXT NOT NULL,
    "roomDetailId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "RoomDetailTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmenityTranslation" (
    "id" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "AmenityTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProvinceTranslation_provinceId_language_key" ON "ProvinceTranslation"("provinceId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "HotelBranchTranslation_hotelBranchId_language_key" ON "HotelBranchTranslation"("hotelBranchId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "HotelRoomTranslation_roomId_language_key" ON "HotelRoomTranslation"("roomId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "RoomDetailTranslation_roomDetailId_language_key" ON "RoomDetailTranslation"("roomDetailId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "AmenityTranslation_amenityId_language_key" ON "AmenityTranslation"("amenityId", "language");

-- AddForeignKey
ALTER TABLE "ProvinceTranslation" ADD CONSTRAINT "ProvinceTranslation_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelBranchTranslation" ADD CONSTRAINT "HotelBranchTranslation_hotelBranchId_fkey" FOREIGN KEY ("hotelBranchId") REFERENCES "HotelBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelRoomTranslation" ADD CONSTRAINT "HotelRoomTranslation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "HotelRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomDetailTranslation" ADD CONSTRAINT "RoomDetailTranslation_roomDetailId_fkey" FOREIGN KEY ("roomDetailId") REFERENCES "RoomDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmenityTranslation" ADD CONSTRAINT "AmenityTranslation_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
