-- CreateEnum
CREATE TYPE "AnalyticsPeriodType" AS ENUM ('DAILY', 'MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "AnalyticsSummary" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "period_type" "AnalyticsPeriodType" NOT NULL,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsSummary_branchId_period_period_type_key" ON "AnalyticsSummary"("branchId", "period", "period_type");

-- AddForeignKey
ALTER TABLE "AnalyticsSummary" ADD CONSTRAINT "AnalyticsSummary_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "HotelBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
