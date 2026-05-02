export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/app/lib/utils";

export default async function AdminNotificationsPage() {
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
    orderBy: { appliedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Notifications
        </h1>
        {pendingLoans.length > 0 && (
          <Badge variant="destructive">{pendingLoans.length}</Badge>
        )}
      </div>

      {pendingLoans.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-10 text-center">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            No pending notifications. All caught up!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {pendingLoans.length} loan{pendingLoans.length !== 1 ? "s" : ""} awaiting your review — newest first
          </p>

          {pendingLoans.map((loan) => (
            <div
              key={loan.id}
              className="bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-500/20 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      ₦{Number(loan.amountRequested).toLocaleString()}
                    </span>
                    <Badge variant="warning">Needs Review</Badge>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1 font-medium">
                    {loan.applicant.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{loan.applicant.email}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
                    Applied{" "}
                    {new Date(loan.appliedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {loan.guarantors.map((g) => (
                      <span
                        key={g.id}
                        className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-0.5"
                      >
                        {g.guarantor.name}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  href="/admin/loans"
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  Review →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
