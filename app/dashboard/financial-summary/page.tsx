export const dynamic = "force-dynamic";

import { getSession, getTotalContributed } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { DownloadStatementButton } from "./DownloadStatementButton";

export default async function FinancialSummaryPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const userId = session.user.id;
  const cooperativeId = session.user.cooperativeId as string;

  const [totalContributed, cooperative, loans, memberDividends] = await Promise.all([
    getTotalContributed(userId),
    prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { name: true, borrowingMultiplier: true, currencySymbol: true },
    }),
    prisma.loanApplication.findMany({
      where: { userId, cooperativeId, deletedAt: null },
      include: { repayments: { select: { amount: true } } },
    }),
    prisma.memberDividend.findMany({
      where: { userId, cooperativeId },
      select: { amount: true, status: true },
    }),
  ]);

  if (!cooperative) redirect("/dashboard");

  const sym = cooperative.currencySymbol;

  const activeLoan = loans.find((l) => l.status === "APPROVED" && !l.repaidAt) ?? null;
  let totalLoaned = 0, totalRepaid = 0, activeBalance = 0;

  for (const loan of loans) {
    totalLoaned += Number(loan.amountRequested);
    const paid = loan.repayments.reduce((s, r) => s + Number(r.amount), 0);
    totalRepaid += paid;
    if (!loan.repaidAt && loan.status === "APPROVED") {
      activeBalance += Number(loan.totalAmountDue ?? loan.amountRequested) - paid;
    }
  }

  const activeLoanBalance = activeLoan
    ? Number(activeLoan.totalAmountDue ?? activeLoan.amountRequested) -
      activeLoan.repayments.reduce((s, r) => s + Number(r.amount), 0)
    : 0;

  const borrowingCapacity = totalContributed * cooperative.borrowingMultiplier;
  const availableToBorrow = Math.max(0, borrowingCapacity - activeBalance);

  const pendingDividend = memberDividends
    .filter((d) => d.status === "PENDING")
    .reduce((s, d) => s + Number(d.amount), 0);
  const paidDividend = memberDividends
    .filter((d) => d.status === "PAID")
    .reduce((s, d) => s + Number(d.amount), 0);

  const completedLoans = loans.filter(
    (l) => l.status !== "PENDING_GUARANTORS" && l.status !== "PENDING_ADMIN_REVIEW" && l.status !== "REJECTED"
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Financial Summary
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Your complete financial position
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Contributed"
          value={`${sym}${totalContributed.toLocaleString()}`}
          sub="Verified contributions"
          color="emerald"
        />
        <StatCard
          label="Active Loan Balance"
          value={activeLoan ? `${sym}${activeLoanBalance.toLocaleString()}` : "None"}
          sub={
            activeLoan
              ? `of ${sym}${Number(activeLoan.amountRequested).toLocaleString()} borrowed`
              : "No active loan"
          }
          color="amber"
        />
        <StatCard
          label="Borrowing Capacity"
          value={`${sym}${borrowingCapacity.toLocaleString()}`}
          sub={`Available: ${sym}${availableToBorrow.toLocaleString()}`}
          color="sky"
        />
        <StatCard
          label={pendingDividend > 0 ? "Pending Dividend" : "Dividends Received"}
          value={`${sym}${(pendingDividend > 0 ? pendingDividend : paidDividend).toLocaleString()}`}
          sub={
            pendingDividend > 0
              ? "Awaiting payout"
              : paidDividend > 0
              ? "Total received"
              : "No dividends yet"
          }
          color="violet"
        />
      </div>

      {/* Detailed breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Contributions">
          <Row label="Verified total" value={`${sym}${totalContributed.toLocaleString()}`} />
          <Row label="Borrowing multiplier" value={`${cooperative.borrowingMultiplier}×`} />
          <Row label="Borrowing capacity" value={`${sym}${borrowingCapacity.toLocaleString()}`} />
          <Row
            label="Available to borrow"
            value={`${sym}${availableToBorrow.toLocaleString()}`}
            highlight
          />
          <div className="pt-2">
            <Link
              href="/dashboard/contributions"
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              View contributions
            </Link>
          </div>
        </Section>

        <Section title="Loans">
          <Row label="Total borrowed" value={`${sym}${totalLoaned.toLocaleString()}`} />
          <Row label="Total repaid" value={`${sym}${totalRepaid.toLocaleString()}`} />
          <Row label="Outstanding balance" value={`${sym}${activeBalance.toLocaleString()}`} />
          <Row label="Loans taken" value={String(completedLoans)} />
          <div className="pt-2">
            <Link
              href="/dashboard/loans"
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              View loans
            </Link>
          </div>
        </Section>
      </div>

      {/* Dividends summary if any */}
      {(pendingDividend > 0 || paidDividend > 0) && (
        <Section title="Dividends">
          <Row label="Pending dividend" value={`${sym}${pendingDividend.toLocaleString()}`} highlight={pendingDividend > 0} />
          <Row label="Total received" value={`${sym}${paidDividend.toLocaleString()}`} />
        </Section>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        {availableToBorrow >= 1000 && (
          <Link href="/dashboard/loans/apply" className={buttonVariants()}>
            Apply for a loan
          </Link>
        )}
        <Link
          href="/dashboard/contributions/submit"
          className={buttonVariants({ variant: "outline" })}
        >
          Submit contribution
        </Link>
        <Link
          href="/dashboard/transactions"
          className={buttonVariants({ variant: "outline" })}
        >
          All transactions
        </Link>
        <DownloadStatementButton
          cooperativeId={cooperativeId}
          userId={userId}
          cooperativeName={cooperative.name}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: "emerald" | "amber" | "sky" | "violet";
}) {
  const colors = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    sky: "text-sky-600 dark:text-sky-400",
    violet: "text-violet-600 dark:text-violet-400",
  };
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-5">
      <p className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-2">
        {label}
      </p>
      <p className={`text-2xl font-semibold ${colors[color]}`}>{value}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{sub}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6 space-y-3">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span
        className={
          highlight
            ? "font-semibold text-emerald-600 dark:text-emerald-400"
            : "font-medium text-zinc-900 dark:text-zinc-100"
        }
      >
        {value}
      </span>
    </div>
  );
}
