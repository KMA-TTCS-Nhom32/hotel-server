-- CreateEnum
CREATE TYPE "BlockAction" AS ENUM ('BLOCK', 'UNBLOCK');

-- CreateTable
CREATE TABLE "UserBlockHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "blockedBy" TEXT NOT NULL,
    "action" "BlockAction" NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBlockHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserBlockHistory_userId_idx" ON "UserBlockHistory"("userId");

-- CreateIndex
CREATE INDEX "UserBlockHistory_blockedBy_idx" ON "UserBlockHistory"("blockedBy");

-- AddForeignKey
ALTER TABLE "UserBlockHistory" ADD CONSTRAINT "UserBlockHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlockHistory" ADD CONSTRAINT "UserBlockHistory_blockedBy_fkey" FOREIGN KEY ("blockedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
