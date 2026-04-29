-- AlterTable: User notification preferences
ALTER TABLE "user" ADD COLUMN "phoneNumber" TEXT;
ALTER TABLE "user" ADD COLUMN "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user" ADD COLUMN "smsNotifications" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable: Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DividendPayout
CREATE TABLE "DividendPayout" (
    "id" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalProfit" DECIMAL(65,30) NOT NULL,
    "adminCosts" DECIMAL(65,30) NOT NULL,
    "loanLossReserve" DECIMAL(65,30) NOT NULL,
    "dividendPool" DECIMAL(65,30) NOT NULL,
    "totalMembers" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DividendPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MemberDividend
CREATE TABLE "MemberDividend" (
    "id" TEXT NOT NULL,
    "payoutId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "contributionPct" DECIMAL(65,30) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberDividend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_cooperativeId_idx" ON "Notification"("cooperativeId");
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "DividendPayout_cooperativeId_idx" ON "DividendPayout"("cooperativeId");
CREATE INDEX "MemberDividend_payoutId_idx" ON "MemberDividend"("payoutId");
CREATE INDEX "MemberDividend_userId_idx" ON "MemberDividend"("userId");
CREATE INDEX "MemberDividend_cooperativeId_idx" ON "MemberDividend"("cooperativeId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DividendPayout" ADD CONSTRAINT "DividendPayout_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberDividend" ADD CONSTRAINT "MemberDividend_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "DividendPayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
