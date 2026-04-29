export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { NewDividendForm } from "./NewDividendForm";
import { ApproveButton, ProcessButton } from "./DividendActions";

export default async function DividendsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "OWNER") redirect("/dashboard");

  const cooperativeId = session.user.cooperativeId as string;

  const [cooperative, payouts] = await Promise.all([
    prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { currencySymbol: true },
    }),
    prisma.dividendPayout.findMany({
      where: { cooperativeId },
      orderBy: { createdAt: "desc" },
      include: {
        memberDividends: { select: { id: true, amount: true, status: true } },
      },
    }),
  ]);

  if (!cooperative) redirect("/dashboard");
  const sym = cooperative.currencySymbol;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Dividend Management
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Distribute cooperative profits to members based on contribution share
          </p>
        </div>
      </div>

      <NewDividendForm cooperativeId={cooperativeId} currencySymbol={sym} />

      {payouts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-8 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No dividend payouts yet. Create one above to get started.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Payout History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Period</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Total Profit</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Pool</th>
                  <th className="px-4 py-3 text-center font-medium text-zinc-500 dark:text-zinc-400">Members</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {payouts.map((payout) => (
                  <tr
                    key={payout.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {payout.period} {payout.year}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                      {sym}{Number(payout.totalProfit).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {sym}{Number(payout.dividendPool).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-400">
                      {payout.totalMembers}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={payout.status} />
                    </td>
                    <td className="px-4 py-3">
                      {payout.status === "PENDING" && (
                        <ApproveButton
                          payoutId={payout.id}
                          cooperativeId={cooperativeId}
                        />
                      )}
                      {payout.status === "APPROVED" && (
                        <ProcessButton
                          payoutId={payout.id}
                          cooperativeId={cooperativeId}
                        />
                      )}
                      {payout.status === "PAID" && (
                        <span className="text-xs text-zinc-400">
                          {payout.paidAt
                            ? `Paid ${payout.paidAt.toLocaleDateString()}`
                            : "Paid"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return <Badge variant="outline">Pending</Badge>;
    case "APPROVED":
      return (
        <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-500/20">
          Approved
        </Badge>
      );
    case "PAID":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20">
          Paid
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
