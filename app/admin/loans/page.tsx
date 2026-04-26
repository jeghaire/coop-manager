import { getSession } from "@/app/lib/auth-helpers";
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

  const pendingLoans = await prisma.loanApplication.findMany({
    where: {
      cooperativeId,
      status: "PENDING_ADMIN_REVIEW",
      deletedAt: null,
    },
    include: {
      applicant: { select: { name: true, email: true } },
      guarantors: {
        where: { deletedAt: null },
        include: { guarantor: { select: { name: true } } },
      },
    },
    orderBy: { appliedAt: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Pending Loan Reviews
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Loans that have been approved by both guarantors and are awaiting your
          decision
        </p>
      </div>

      {pendingLoans.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-10 text-center">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            No loans pending review. All caught up!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingLoans.map((loan) => (
            <div
              key={loan.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      ₦{Number(loan.amountRequested).toLocaleString()}
                    </span>
                    <Badge variant="sky">Pending Review</Badge>
                  </div>

                  <div className="mt-2 space-y-0.5">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                      {loan.applicant.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {loan.applicant.email}
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

                  {/* Guarantor status */}
                  <div className="mt-3 flex flex-wrap gap-3">
                    {loan.guarantors.map((g) => (
                      <div key={g.id} className="flex items-center gap-1.5 text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {g.guarantor.name}:
                        </span>
                        {guarantorStatusBadge(g.status)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <LoanReviewForm loanId={loan.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
