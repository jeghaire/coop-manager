export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { ContributionReviewForm } from "./ContributionReviewForm";

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  MOBILE_MONEY: "Mobile Money",
  CASH: "Cash",
};

export default async function AdminContributionsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "OWNER" && role !== "TREASURER") {
    redirect("/dashboard");
  }

  const cooperativeId = session.user.cooperativeId as string;

  const pending = await prisma.contribution.findMany({
    where: {
      cooperativeId,
      status: "PENDING_VERIFICATION",
      deletedAt: null,
    },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { submittedAt: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Pending Contributions
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Verify member payments against their submitted receipts
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-10 text-center">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            No contributions pending verification. All caught up!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      ₦{Number(c.amount).toLocaleString()}
                    </span>
                    <Badge variant="warning">Pending</Badge>
                    <span className="text-xs text-zinc-400 dark:text-zinc-600">
                      {PAYMENT_METHOD_LABEL[c.paymentMethod] ?? c.paymentMethod}
                    </span>
                  </div>

                  <div className="mt-2 space-y-0.5">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {c.user.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {c.user.email}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-600">
                      Submitted{" "}
                      {new Date(c.submittedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {c.receiptUrl && (
                    <a
                      href={c.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      View receipt ↗
                    </a>
                  )}
                </div>
              </div>

              <ContributionReviewForm contributionId={c.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
