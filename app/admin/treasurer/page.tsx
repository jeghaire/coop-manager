export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { RecordContributionForm } from "./RecordContributionForm";
import { RecordRepaymentForm } from "./RecordRepaymentForm";

export default async function TreasurerPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "OWNER" && role !== "TREASURER") {
    redirect("/dashboard");
  }

  const cooperativeId = session.user.cooperativeId as string;

  const [members, activeLoans, cooperative] = await Promise.all([
    prisma.user.findMany({
      where: { cooperativeId, deletedAt: null },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.loanApplication.findMany({
      where: { cooperativeId, status: "APPROVED", deletedAt: null },
      include: {
        applicant: { select: { name: true } },
        repayments: { select: { amount: true } },
      },
      orderBy: { approvedAt: "desc" },
    }),
    prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { currencySymbol: true },
    }),
  ]);

  const sym = cooperative?.currencySymbol ?? "₦";

  const loansWithBalance = activeLoans.map((loan) => {
    const totalDue = Number(loan.totalAmountDue ?? loan.amountRequested);
    const totalPaid = loan.repayments.reduce((s, r) => s + Number(r.amount), 0);
    const remaining = Math.max(0, totalDue - totalPaid);
    return { ...loan, remaining };
  });

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Manual Entry
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Record contributions and loan repayments on behalf of members
        </p>
      </div>

      {/* Record Contribution */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Record Contribution
        </h2>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6">
          <RecordContributionForm members={members} currencySymbol={sym} />
        </div>
      </section>

      {/* Record Loan Repayment */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Record Loan Repayment
        </h2>
        {loansWithBalance.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-8 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No active loans to record repayments for.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6">
            <RecordRepaymentForm loans={loansWithBalance} currencySymbol={sym} />
          </div>
        )}
      </section>
    </div>
  );
}
