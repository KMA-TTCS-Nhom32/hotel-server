-- AlterTable
ALTER TABLE "User" ADD COLUMN "email_hash" TEXT,
ADD COLUMN "phone_hash" TEXT;

-- DropIndex (email, phone combo)
DROP INDEX IF EXISTS "User_email_phone_key";

-- CreateIndex
CREATE UNIQUE INDEX "User_email_hash_key" ON "User"("email_hash");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_hash_key" ON "User"("phone_hash");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_hash_phone_hash_key" ON "User"("email_hash", "phone_hash");
