export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { GuarantorResponseForm } from "./GuarantorResponseForm";

function loanStatusBadge(status: string) {
  switch (status) {
    case "PENDING_GUARANTORS":
      return <Badge variant="warning">Awaiting Guarantors</Badge>;
    case "PENDING_ADMIN_REVIEW":
      return <Badge variant="sky">Pending Review</Badge>;
    case "APPROVED":
      return <Badge variant="success">Approved</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function guarantorStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return <Badge variant="warning">Awaiting Response</Badge>;
    case "ACCEPTED":
      return <Badge variant="success">Accepted</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default async function LoansPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const userId = session.user.id;
  const cooperativeId = session.user.cooperativeId as string;

  const [myLoans, guarantorRequests] = await Promise.all([
    prisma.loanApplication.findMany({
      where: { userId, cooperativeId, deletedAt: null },
      include: {
        guarantors: {
          where: { deletedAt: null },
          include: { guarantor: { select: { name: true } } },
        },
      },
      orderBy: { appliedAt: "desc" },
    }),
    prisma.loanGuarantor.findMany({
      where: { guarantorId: userId, deletedAt: null },
      include: {
        loan: {
          include: {
            applicant: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const pendingGuarantorRequests = guarantorRequests.filter(
    (g) => g.status === "PENDING" && g.loan.status === "PENDING_GUARANTORS"
  );
  const pastGuarantorRequests = guarantorRequests.filter(
    (g) => g.status !== "PENDING" || g.loan.status !== "PENDING_GUARANTORS"
  );

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Loans
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage your loan applications and guarantor requests
          </p>
        </div>
        <Link href="/dashboard/loans/apply" className={buttonVariants({ size: "sm" })}>
          Apply for Loan
        </Link>
      </div>

      {/* Guarantor Requests */}
      {pendingGuarantorRequests.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Guarantor Requests
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold">
              {pendingGuarantorRequests.length}
            </span>
          </h2>
          <div className="space-y-3">
            {pendingGuarantorRequests.map((g) => (
              <div
                key={g.id}
                className="bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-500/20 rounded-xl p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {g.loan.applicant.name}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Requesting{" "}
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        ₦{Number(g.loan.amountRequested).toLocaleString()}
                      </span>
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
                      Applied{" "}
                      {new Date(g.loan.appliedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge variant="warning">Action Required</Badge>
                </div>
                <GuarantorResponseForm loanId={g.loan.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* My Loan Applications */}
      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          My Applications
        </h2>
        {myLoans.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-8 text-center">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              No loan applications yet.
            </p>
            <Link href="/dashboard/loans/apply" className={buttonVariants({ size: "sm" }) + " mt-4"}>
              Apply for your first loan
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myLoans.map((loan) => (
              <div
                key={loan.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        ₦{Number(loan.amountRequested).toLocaleString()}
                      </span>
                      {loanStatusBadge(loan.status)}
                    </div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
                      Applied{" "}
                      {new Date(loan.appliedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>

                    {/* Guarantor status */}
                    {loan.guarantors.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {loan.guarantors.map((g) => (
                          <div
                            key={g.id}
                            className="flex items-center gap-1.5 text-xs"
                          >
                            <span className="text-zinc-500 dark:text-zinc-400">
                              {g.guarantor.name}:
                            </span>
                            {guarantorStatusBadge(g.status)}
                          </div>
                        ))}
                      </div>
                    )}

                    {loan.status === "REJECTED" && loan.rejectionReason && (
                      <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                        Reason: {loan.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past Guarantor Activity */}
      {pastGuarantorRequests.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Guarantor History
          </h2>
          <div className="space-y-3">
            {pastGuarantorRequests.map((g) => (
              <div
                key={g.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {g.loan.applicant.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      ₦{Number(g.loan.amountRequested).toLocaleString()} •{" "}
                      {new Date(g.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {guarantorStatusBadge(g.status)}
                    {loanStatusBadge(g.loan.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
