export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default async function TransactionsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const userId = session.user.id;
  const cooperativeId = session.user.cooperativeId as string;

  const [cooperative, contributions, loans] = await Promise.all([
    prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { currencySymbol: true },
    }),
    prisma.contribution.findMany({
      where: { userId, cooperativeId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    prisma.loanApplication.findMany({
      where: { userId, cooperativeId, deletedAt: null },
      include: { repayments: { orderBy: { paidAt: "desc" } } },
    }),
  ]);

  if (!cooperative) redirect("/dashboard");

  const sym = cooperative.currencySymbol;

  type TxRow = {
    date: Date;
    kind: "contribution" | "repayment";
    amount: number;
    status: string;
    ref: string;
  };

  const rows: TxRow[] = [];

  for (const c of contributions) {
    rows.push({
      date: c.createdAt,
      kind: "contribution",
      amount: Number(c.amount),
      status: c.status,
      ref: c.id.slice(-8),
    });
  }

  for (const loan of loans) {
    for (const r of loan.repayments) {
      rows.push({
        date: r.paidAt,
        kind: "repayment",
        amount: Number(r.amount),
        status: "RECORDED",
        ref: loan.id.slice(-8),
      });
    }
  }

  rows.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            All Transactions
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {rows.length} transaction{rows.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/financial-summary"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          ← Summary
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500 dark:text-zinc-400">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">
                    Ref
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {rows.map((tx, i) => (
                  <tr
                    key={i}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {tx.date.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={tx.kind === "contribution" ? "default" : "secondary"}>
                        {tx.kind === "contribution" ? "Contribution" : "Repayment"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      {sym}{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400 hidden sm:table-cell">
                      …{tx.ref}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "VERIFIED":
    case "RECORDED":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20">
          Verified
        </Badge>
      );
    case "PENDING_VERIFICATION":
      return <Badge variant="outline">Pending</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
