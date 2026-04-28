export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default async function RejectedLoanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const userId = session.user.id;
  const cooperativeId = session.user.cooperativeId as string;

  const loan = await prisma.loanApplication.findUnique({
    where: { id },
    include: {
      guarantors: {
        where: { deletedAt: null },
        include: { guarantor: { select: { name: true } } },
      },
    },
  });

  if (!loan || loan.cooperativeId !== cooperativeId || loan.userId !== userId) {
    redirect("/dashboard/loans");
  }

  if (loan.status !== "REJECTED") {
    redirect("/dashboard/loans");
  }

  const retryUrl = `/dashboard/loans/apply?retryId=${loan.id}`;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link
          href="/dashboard/loans"
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          ← Back to Loans
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mt-3">
          Loan Rejected
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          ₦{Number(loan.amountRequested).toLocaleString()} — applied{" "}
          {new Date(loan.appliedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      <Alert variant="destructive">
        <AlertDescription>
          <strong>Rejection reason:</strong>{" "}
          {loan.rejectionReason ?? "No reason provided."}
        </AlertDescription>
      </Alert>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          Original Guarantors
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

      <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/40 rounded-xl p-5 space-y-3">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          You can retry with the same guarantors or apply again with different ones.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link href={retryUrl} className={cn(buttonVariants({ size: "sm" }))}>
            Retry Application
          </Link>
          <Link
            href="/dashboard/loans/apply"
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
          >
            New Application
          </Link>
        </div>
      </div>
    </div>
  );
}
