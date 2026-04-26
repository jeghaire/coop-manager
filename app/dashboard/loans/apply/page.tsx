import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { LoanApplicationForm } from "./LoanApplicationForm";
import Link from "next/link";

export default async function ApplyForLoanPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const userId = session.user.id;
  const cooperativeId = session.user.cooperativeId as string;

  // Fetch eligible guarantors: same coop, active, not self, not ADMIN/OWNER
  const members = await prisma.user.findMany({
    where: {
      cooperativeId,
      deletedAt: null,
      id: { not: userId },
      role: { notIn: ["ADMIN", "OWNER"] },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

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
          Apply for a Loan
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Two members of your cooperative must agree to guarantee your loan
          before an admin can approve it.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6">
        {members.length < 2 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Your cooperative doesn&apos;t have enough eligible members to
            guarantee a loan yet. You need at least two other active members.
          </p>
        ) : (
          <LoanApplicationForm members={members} />
        )}
      </div>
    </div>
  );
}
