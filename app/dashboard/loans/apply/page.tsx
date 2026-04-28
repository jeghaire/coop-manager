export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { LoanApplicationForm } from "./LoanApplicationForm";
import Link from "next/link";

export default async function ApplyForLoanPage({
  searchParams,
}: {
  searchParams: Promise<{ retryId?: string }>;
}) {
  const { retryId } = await searchParams;
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const userId = session.user.id;
  const cooperativeId = session.user.cooperativeId as string;

  const [cooperative, contributions, dbUser] = await Promise.all([
    prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { borrowingMultiplier: true, guarantorCoverageMode: true },
    }),
    prisma.contribution.findMany({
      where: { userId, status: "VERIFIED", deletedAt: null },
      select: { amount: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { verifiedAt: true, role: true },
    }),
  ]);

  // Fetch eligible guarantors: same coop, active, verified, not self, not ADMIN/OWNER
  const members = await prisma.user.findMany({
    where: {
      cooperativeId,
      deletedAt: null,
      id: { not: userId },
      role: { notIn: ["ADMIN", "OWNER"] },
      verifiedAt: { not: null },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const totalContributed = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
  const borrowingCapacity = cooperative ? totalContributed * cooperative.borrowingMultiplier : 0;

  // If retrying a rejected loan, pre-fill form values
  let retryData: { amount: string; guarantor1Id: string; guarantor2Id: string } | null = null;
  if (retryId) {
    const originalLoan = await prisma.loanApplication.findUnique({
      where: { id: retryId, userId, cooperativeId },
      include: {
        guarantors: {
          where: { deletedAt: null },
          select: { guarantorId: true },
        },
      },
    });
    if (originalLoan && originalLoan.status === "REJECTED" && originalLoan.guarantors.length >= 2) {
      retryData = {
        amount: String(originalLoan.amountRequested),
        guarantor1Id: originalLoan.guarantors[0].guarantorId,
        guarantor2Id: originalLoan.guarantors[1].guarantorId,
      };
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link
          href="/dashboard/loans"
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          ← Back to Loans
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mt-3">
          {retryData ? "Retry Loan Application" : "Apply for a Loan"}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Two verified members of your cooperative must guarantee your loan before an admin can approve it.
        </p>
      </div>

      {/* Borrowing capacity */}
      <div className="mb-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 space-y-1">
        <p className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
          Your Borrowing Capacity
        </p>
        <p className="text-2xl font-semibold text-emerald-800 dark:text-emerald-300">
          ₦{borrowingCapacity.toLocaleString()}
        </p>
        <p className="text-xs text-emerald-700 dark:text-emerald-500">
          Based on ₦{totalContributed.toLocaleString()} contributed × {cooperative?.borrowingMultiplier ?? 3}× multiplier
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6">
        {members.length < 2 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Your cooperative doesn&apos;t have enough eligible verified members to guarantee a loan yet. You need at least two other verified members.
          </p>
        ) : totalContributed === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You need at least one verified contribution before applying for a loan.
          </p>
        ) : (
          <LoanApplicationForm
            members={members}
            borrowingCapacity={borrowingCapacity}
            guarantorCoverageMode={cooperative?.guarantorCoverageMode ?? "COMBINED"}
            defaultValues={retryData ?? undefined}
          />
        )}
      </div>
    </div>
  );
}
