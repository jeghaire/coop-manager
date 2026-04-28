export const dynamic = "force-dynamic";

import { getSession, getTotalContributed } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { LoanReviewForm } from "./LoanReviewForm";

function guarantorStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return <Badge variant="warning">Pending</Badge>;
    case "ACCEPTED":
      return <Badge variant="success">Accepted</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default async function AdminLoansPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "OWNER") redirect("/dashboard");

  const cooperativeId = session.user.cooperativeId as string;

  const [pendingLoans, cooperative] = await Promise.all([
    prisma.loanApplication.findMany({
      where: {
        cooperativeId,
        status: "PENDING_ADMIN_REVIEW",
        deletedAt: null,
      },
      include: {
        applicant: { select: { id: true, name: true, email: true } },
        guarantors: {
          where: { deletedAt: null },
          include: { guarantor: { select: { id: true, name: true } } },
        },
      },
      orderBy: { appliedAt: "asc" },
    }),
    prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { borrowingMultiplier: true, guarantorCoverageMode: true },
    }),
  ]);

  // Fetch contribution totals for all involved users
  type LoanWithContribs = (typeof pendingLoans)[number] & {
    applicantContribution: number;
    borrowingCapacity: number;
    guarantorContributions: { id: string; name: string; total: number }[];
    covered: boolean;
  };

  const enrichedLoans: LoanWithContribs[] = await Promise.all(
    pendingLoans.map(async (loan) => {
      const [applicantTotal, ...guarantorTotals] = await Promise.all([
        getTotalContributed(loan.applicant.id),
        ...loan.guarantors.map((g) => getTotalContributed(g.guarantor.id)),
      ]);

      const capacity = applicantTotal * (cooperative?.borrowingMultiplier ?? 3);
      const amount = Number(loan.amountRequested);
      const mode = cooperative?.guarantorCoverageMode ?? "OFF";

      const guarantorContributions = loan.guarantors.map((g, i) => ({
        id: g.guarantor.id,
        name: g.guarantor.name,
        total: guarantorTotals[i],
      }));

      let covered = true;
      if (mode === "COMBINED") {
        const combined = guarantorContributions.reduce((s, g) => s + g.total, 0);
        covered = combined >= amount;
      } else if (mode === "INDIVIDUAL") {
        covered = guarantorContributions.every((g) => g.total >= amount);
      }

      return {
        ...loan,
        applicantContribution: applicantTotal,
        borrowingCapacity: capacity,
        guarantorContributions,
        covered,
      };
    })
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Pending Loan Reviews
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Loans approved by both guarantors and awaiting your decision
        </p>
      </div>

      {enrichedLoans.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-10 text-center">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            No loans pending review. All caught up!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {enrichedLoans.map((loan) => {
            const amount = Number(loan.amountRequested);
            return (
              <div
                key={loan.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                        ₦{amount.toLocaleString()}
                      </span>
                      <Badge variant="sky">Pending Review</Badge>
                      {loan.covered ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Covered</span>
                      ) : (
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">✗ Under-covered</span>
                      )}
                    </div>

                    <div className="mt-3 space-y-1">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {loan.applicant.name}
                        <span className="text-xs text-zinc-400 dark:text-zinc-600 font-normal ml-2">
                          {loan.applicant.email}
                        </span>
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Contributed: ₦{loan.applicantContribution.toLocaleString()} · Capacity: ₦{loan.borrowingCapacity.toLocaleString()}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-600">
                        Applied{" "}
                        {new Date(loan.appliedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Guarantor details */}
                    <div className="mt-3 space-y-1.5">
                      {loan.guarantors.map((g) => {
                        const contrib = loan.guarantorContributions.find(
                          (gc) => gc.id === g.guarantor.id
                        );
                        return (
                          <div key={g.id} className="flex items-center gap-2 text-xs flex-wrap">
                            <span className="text-zinc-500 dark:text-zinc-400">
                              {g.guarantor.name}:
                            </span>
                            {guarantorStatusBadge(g.status)}
                            {contrib && (
                              <span className="text-zinc-400 dark:text-zinc-600">
                                ₦{contrib.total.toLocaleString()} contributed
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {cooperative && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-600 italic">
                          Coverage mode: {cooperative.guarantorCoverageMode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <LoanReviewForm loanId={loan.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
