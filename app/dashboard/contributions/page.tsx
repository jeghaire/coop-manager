import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  MOBILE_MONEY: "Mobile Money",
  CASH: "Cash",
};

function statusBadge(status: string) {
  switch (status) {
    case "PENDING_VERIFICATION":
      return <Badge variant="warning">Pending</Badge>;
    case "VERIFIED":
      return <Badge variant="success">Verified</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default async function ContributionsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const userId = session.user.id;
  const cooperativeId = session.user.cooperativeId as string;

  const contributions = await prisma.contribution.findMany({
    where: { userId, cooperativeId, deletedAt: null },
    orderBy: { submittedAt: "desc" },
  });

  const verifiedTotal = contributions
    .filter((c) => c.status === "VERIFIED")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Contributions
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Track your monthly contribution history
          </p>
        </div>
        <Link
          href="/dashboard/contributions/submit"
          className={buttonVariants({ size: "sm" })}
        >
          Submit Contribution
        </Link>
      </div>

      {/* Verified total */}
      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-5">
        <p className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">
          Total Verified
        </p>
        <p className="text-3xl font-semibold text-emerald-800 dark:text-emerald-300">
          ₦{verifiedTotal.toLocaleString()}
        </p>
      </div>

      {/* Contribution list */}
      {contributions.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-8 text-center">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            No contributions yet.
          </p>
          <Link
            href="/dashboard/contributions/submit"
            className={buttonVariants({ size: "sm" }) + " mt-4"}
          >
            Submit your first contribution
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {contributions.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      ₦{Number(c.amount).toLocaleString()}
                    </span>
                    {statusBadge(c.status)}
                    <span className="text-xs text-zinc-400 dark:text-zinc-600">
                      {PAYMENT_METHOD_LABEL[c.paymentMethod] ?? c.paymentMethod}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
                    Submitted{" "}
                    {new Date(c.submittedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {c.receiptUrl && (
                    <a
                      href={c.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline mt-1 inline-block"
                    >
                      View receipt ↗
                    </a>
                  )}
                  {c.status === "REJECTED" && c.rejectionReason && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                      Reason: {c.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
