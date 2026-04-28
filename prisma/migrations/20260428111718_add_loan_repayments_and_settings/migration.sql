-- AlterEnum
ALTER TYPE "LoanStatus" ADD VALUE 'REPAID';

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'DIRECT_PAYMENT';

-- AlterTable
ALTER TABLE "Cooperative" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'NGN',
ADD COLUMN     "currencySymbol" TEXT NOT NULL DEFAULT '₦',
ADD COLUMN     "defaultGracePeriodDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "loanInterestRate" DECIMAL(65,30) NOT NULL DEFAULT 10,
ADD COLUMN     "loanRepaymentMonths" INTEGER NOT NULL DEFAULT 12;

-- AlterTable
ALTER TABLE "LoanApplication" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "interestRate" DECIMAL(65,30),
ADD COLUMN     "repaidAt" TIMESTAMP(3),
ADD COLUMN     "repaymentMonths" INTEGER,
ADD COLUMN     "totalAmountDue" DECIMAL(65,30);

-- CreateTable
CREATE TABLE "LoanRepayment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paymentType" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "recordedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanRepayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoanRepayment_loanId_idx" ON "LoanRepayment"("loanId");

-- AddForeignKey
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "LoanApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
