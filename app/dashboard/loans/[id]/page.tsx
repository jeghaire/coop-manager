export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { generateRepaymentSchedule, calculateLoanHealth } from "@/app/lib/loan-helpers";
import { RepaymentForm } from "./RepaymentForm";

function statusBadge(status: string) {
  switch (status) {
    case "APPROVED":
      return <Badge variant="success">Approved</Badge>;
    case "REPAID":
      return <Badge variant="secondary">Repaid</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    case "PENDING_ADMIN_REVIEW":
      return <Badge variant="sky">Pending Review</Badge>;
    case "PENDING_GUARANTORS":
      return <Badge variant="warning">Awaiting Guarantors</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function monthStatusBadge(status: "PAID" | "PARTIAL" | "BEHIND" | "UPCOMING") {
  switch (status) {
    case "PAID":
      return <Badge variant="success">Paid</Badge>;
    case "PARTIAL":
      return <Badge variant="warning">Partial</Badge>;
    case "BEHIND":
      return <Badge variant="destructive">Behind</Badge>;
    case "UPCOMING":
      return <Badge variant="secondary">Upcoming</Badge>;
  }
}

export default async function LoanDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const userId = session.user.id;
  const cooperativeId = session.user.cooperativeId as string;
  const role = session.user.role as string;
  const isAdmin = role === "ADMIN" || role === "OWNER" || role === "TREASURER";

  const [loan, cooperative] = await Promise.all([
    prisma.loanApplication.findUnique({
      where: { id },
      include: {
        repayments: { orderBy: { paidAt: "asc" } },
        applicant: { select: { name: true } },
        guarantors: {
          where: { deletedAt: null },
          include: { guarantor: { select: { name: true } } },
        },
      },
    }),
    prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { currencySymbol: true },
    }),
  ]);

  if (!loan || loan.cooperativeId !== cooperativeId) redirect("/dashboard/loans");
  if (!isAdmin && loan.userId !== userId) redirect("/dashboard/loans");

  const isOwn = loan.userId === userId;
  const isActive = loan.status === "APPROVED";

  const sym = cooperative?.currencySymbol ?? "₦";
  const fmt = (n: number) =>
    `${sym}${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const principal = Number(loan.amountRequested);
  const interestRate = loan.interestRate ? Number(loan.interestRate) : null;
  const totalDue = loan.totalAmountDue ? Number(loan.totalAmountDue) : null;
  const repaymentMonths = loan.repaymentMonths ?? null;

  const totalPaid = loan.repayments.reduce((s, r) => s + Number(r.amount), 0);
  const remaining = totalDue != null ? Math.max(0, totalDue - totalPaid) : null;
  const progressPct =
    totalDue && totalDue > 0 ? Math.min(100, (totalPaid / totalDue) * 100) : 0;

  const schedule =
    totalDue && repaymentMonths && loan.approvedAt
      ? generateRepaymentSchedule(totalDue, repaymentMonths, loan.approvedAt)
      : null;

  type MonthRow = {
    month: number;
    dueDate: Date;
    monthlyDue: number;
    amountPaid: number;
    runningBalance: number;
    status: "PAID" | "PARTIAL" | "BEHIND" | "UPCOMING";
  };

  let scheduleRows: MonthRow[] = [];
  if (schedule && totalDue) {
    let pool = totalPaid;
    let runningBalance = totalDue;
    const now = new Date();

    scheduleRows = schedule.map((s) => {
      const monthPaid = Math.min(pool, s.monthlyDue);
      pool = Math.max(0, pool - s.monthlyDue);
      runningBalance = Math.max(0, runningBalance - monthPaid);

      let rowStatus: MonthRow["status"];
      if (monthPaid >= s.monthlyDue - 0.01) {
        rowStatus = "PAID";
      } else if (monthPaid > 0) {
        rowStatus = "PARTIAL";
      } else if (s.dueDate < now) {
        rowStatus = "BEHIND";
      } else {
        rowStatus = "UPCOMING";
      }

      return {
        month: s.month,
        dueDate: s.dueDate,
        monthlyDue: s.monthlyDue,
        amountPaid: monthPaid,
        runningBalance,
        status: rowStatus,
      };
    });
  }

  const health =
    totalDue && repaymentMonths && loan.approvedAt
      ? calculateLoanHealth(totalDue, totalPaid, loan.approvedAt, repaymentMonths)
      : null;

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/loans"
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          ← Back to Loans
        </Link>
        <div className="flex items-center gap-3 flex-wrap mt-3">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {fmt(principal)}
          </h1>
          {statusBadge(loan.status)}
          {health?.status === "BEHIND" && (
            <Badge variant="warning">{health.daysOverdue}d overdue</Badge>
          )}
          {health?.status === "DEFAULTED" && (
            <Badge variant="destructive">{health.daysOverdue}d overdue</Badge>
          )}
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {isAdmin && !isOwn && `${loan.applicant.name} · `}
          Applied{" "}
          {new Date(loan.appliedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
          {loan.approvedAt && (
            <>
              {" · "}Approved{" "}
              {new Date(loan.approvedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </>
          )}
        </p>
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-medium">Principal</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{fmt(principal)}</p>
          </div>
          {interestRate !== null && (
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-medium">Interest Rate</p>
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{interestRate}%</p>
              {totalDue !== null && (
                <p className="text-xs text-zinc-400 dark:text-zinc-600">{fmt(totalDue - principal)} interest</p>
              )}
            </div>
          )}
          {totalDue !== null && (
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-medium">Total Due</p>
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{fmt(totalDue)}</p>
              {repaymentMonths && (
                <p className="text-xs text-zinc-400 dark:text-zinc-600">over {repaymentMonths} months</p>
              )}
            </div>
          )}
          {totalDue !== null && (
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-medium">Amount Paid</p>
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{fmt(totalPaid)}</p>
            </div>
          )}
          {remaining !== null && (
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-medium">Remaining</p>
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{fmt(remaining)}</p>
            </div>
          )}
          {totalDue !== null && repaymentMonths && (
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-medium">Monthly Due</p>
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {fmt(totalDue / repaymentMonths)}
              </p>
            </div>
          )}
        </div>

        {totalDue !== null && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Payment progress</span>
              <span>{progressPct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Member repayment form */}
      {isOwn && isActive && totalDue !== null && remaining !== null && remaining > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Make a Payment</h2>
          <RepaymentForm loanId={loan.id} remaining={remaining} currencySymbol={sym} />
        </div>
      )}

      {/* Admin/treasurer repayment entry */}
      {isAdmin && isActive && totalDue !== null && remaining !== null && remaining > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-500/20 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Record Repayment</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            Manually record a payment on behalf of {loan.applicant.name}.
          </p>
          <RepaymentForm loanId={loan.id} remaining={remaining} currencySymbol={sym} adminMode />
        </div>
      )}

      {/* Repayment schedule table */}
      {scheduleRows.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Repayment Schedule</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                    Due Date
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Due
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                    Balance
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {scheduleRows.map((row) => (
                  <tr
                    key={row.month}
                    className={
                      row.status === "BEHIND" || row.status === "PARTIAL"
                        ? "bg-amber-50/40 dark:bg-amber-500/5"
                        : ""
                    }
                  >
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">{row.month}</td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">
                      {row.dueDate.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">
                      {fmt(row.monthlyDue)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                      {row.amountPaid > 0 ? fmt(row.amountPaid) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-500 dark:text-zinc-400 hidden md:table-cell">
                      {fmt(row.runningBalance)}
                    </td>
                    <td className="px-4 py-3 text-right">{monthStatusBadge(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment history */}
      {loan.repayments.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Payment History</h2>
          </div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loan.repayments.map((r) => (
              <li key={r.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{fmt(Number(r.amount))}</p>
                  {r.note && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-600">{r.note}</p>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
                  {new Date(r.paidAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Guarantors */}
      {loan.guarantors.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
            Guarantors
          </h2>
          <ul className="space-y-2">
            {loan.guarantors.map((g) => (
              <li key={g.id} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0" />
                {g.guarantor.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
