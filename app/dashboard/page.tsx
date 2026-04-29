export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const user = session.user;
  const cooperativeId = user.cooperativeId as string;

  // Summary counts
  const [myActiveLoans, myPendingGuarantorRequests, verifiedContributions] =
    await Promise.all([
      prisma.loanApplication.count({
        where: {
          userId: user.id,
          cooperativeId,
          status: { in: ["PENDING_GUARANTORS", "PENDING_ADMIN_REVIEW"] },
          deletedAt: null,
        },
      }),
      prisma.loanGuarantor.count({
        where: {
          guarantorId: user.id,
          status: "PENDING",
          deletedAt: null,
          loan: { status: "PENDING_GUARANTORS" },
        },
      }),
      prisma.contribution.findMany({
        where: { userId: user.id, cooperativeId, status: "VERIFIED", deletedAt: null },
        select: { amount: true },
      }),
    ]);

  const verifiedTotal = verifiedContributions.reduce(
    (sum, c) => sum + Number(c.amount),
    0
  );

  function roleBadge(role: string) {
    switch (role) {
      case "OWNER":
        return <Badge variant="success">{role}</Badge>;
      case "ADMIN":
        return <Badge variant="sky">{role}</Badge>;
      case "TREASURER":
        return <Badge variant="warning">{role}</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-2">
          {roleBadge(user.role as string)}
          <span>·</span>
          <span>{user.email}</span>
        </p>
      </div>

      {/* Alerts */}
      {myPendingGuarantorRequests > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
            You have {myPendingGuarantorRequests} guarantor{" "}
            {myPendingGuarantorRequests === 1 ? "request" : "requests"} waiting
            for your response.
          </p>
          <Link href="/dashboard/loans" className={buttonVariants({ size: "sm", variant: "outline" })}>
            Review
          </Link>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-5">
          <p className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-2">
            Total Contributed
          </p>
          <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            ₦{verifiedTotal.toLocaleString()}
          </p>
          <Link href="/dashboard/contributions" className={buttonVariants({ size: "sm", variant: "ghost" }) + " mt-3 -ml-2 text-emerald-600 dark:text-emerald-400"}>
            View history →
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-5">
          <p className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-2">
            Active Loans
          </p>
          <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            {myActiveLoans}
          </p>
          <Link href="/dashboard/loans" className={buttonVariants({ size: "sm", variant: "ghost" }) + " mt-3 -ml-2 text-emerald-600 dark:text-emerald-400"}>
            View loans →
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-5">
          <p className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-2">
            Guarantor Requests
          </p>
          <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            {myPendingGuarantorRequests}
          </p>
          <Link href="/dashboard/loans" className={buttonVariants({ size: "sm", variant: "ghost" }) + " mt-3 -ml-2 text-emerald-600 dark:text-emerald-400"}>
            Respond →
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/dashboard/financial-summary"
            className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 hover:border-emerald-300 dark:hover:border-emerald-500/30 rounded-xl p-5 transition-colors"
          >
            <p className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
              Financial Summary →
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Your full financial position at a glance
            </p>
          </Link>

          <Link
            href="/dashboard/contributions/submit"
            className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 hover:border-emerald-300 dark:hover:border-emerald-500/30 rounded-xl p-5 transition-colors"
          >
            <p className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
              Submit Contribution →
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Record a payment for admin verification
            </p>
          </Link>

          <Link
            href="/dashboard/loans/apply"
            className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 hover:border-emerald-300 dark:hover:border-emerald-500/30 rounded-xl p-5 transition-colors"
          >
            <p className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
              Apply for a Loan →
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Submit an application with two guarantors
            </p>
          </Link>

          <Link
            href="/dashboard/loans"
            className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 hover:border-emerald-300 dark:hover:border-emerald-500/30 rounded-xl p-5 transition-colors"
          >
            <p className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
              My Loans →
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Track your applications and guarantor status
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
