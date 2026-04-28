-- AlterTable
ALTER TABLE "Cooperative" ADD COLUMN     "borrowingMultiplier" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "guarantorCoverageMode" TEXT NOT NULL DEFAULT 'COMBINED';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;

-- CreateTable
CREATE TABLE "CooperativeBank" (
    "id" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CooperativeBank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CooperativeBank_cooperativeId_idx" ON "CooperativeBank"("cooperativeId");

-- AddForeignKey
ALTER TABLE "CooperativeBank" ADD CONSTRAINT "CooperativeBank_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE CASCADE ON UPDATE CASCADE;
