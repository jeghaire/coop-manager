import { getDividendSnapshot } from "./data";
import { Badge } from "@/components/ui/badge";

const ROLE_BADGE: Record<string, "success" | "sky" | "warning" | "secondary"> =
  {
    OWNER: "success",
    ADMIN: "sky",
    TREASURER: "warning",
    MEMBER: "secondary",
  };

export async function DividendSnapshot({
  cooperativeId,
  distributionAmount,
}: {
  cooperativeId: string;
  distributionAmount: number;
}) {
  const { rows, grandTotal } = await getDividendSnapshot(cooperativeId);

  if (rows.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-10 text-center">
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          No verified contributions yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex-1 min-w-50">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-1">
            Total Fund
          </p>
          <p className="text-2xl font-semibold text-emerald-800 dark:text-emerald-300">
            ₦{grandTotal.toLocaleString()}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
            Verified contributions
          </p>
        </div>

        {distributionAmount > 0 && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-4 flex-1 min-w-50">
            <p className="text-xs font-mono font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1">
              Distribution Amount
            </p>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              ₦{distributionAmount.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Pro-rated by contribution %
            </p>
          </div>
        )}
      </div>

      {distributionAmount === 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
          Add <code className="font-mono text-xs">?distribute=AMOUNT</code> to
          the URL to calculate individual dividend payouts. For example:{" "}
          <code className="font-mono text-xs">?tab=dividends&distribute=500000</code>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Member
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                Contributed (₦)
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Share %
              </th>
              {distributionAmount > 0 && (
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Dividend (₦)
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((row, i) => {
              const dividend =
                distributionAmount > 0
                  ? (row.percentage / 100) * distributionAmount
                  : 0;
              return (
                <tr
                  key={row.id}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400 dark:text-zinc-600 w-5 text-right shrink-0">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {row.name}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
                          {row.email}
                        </p>
                      </div>
                      <Badge
                        variant={ROLE_BADGE[row.role] ?? "secondary"}
                        className="hidden md:inline-flex"
                      >
                        {row.role}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-700 dark:text-zinc-300 hidden sm:table-cell">
                    {row.totalContributed.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 hidden sm:block">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${row.percentage}%` }}
                        />
                      </div>
                      <span className="text-zinc-700 dark:text-zinc-300 font-mono text-sm tabular-nums">
                        {row.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  {distributionAmount > 0 && (
                    <td className="px-5 py-3 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                      {Math.round(dividend).toLocaleString()}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {distributionAmount > 0 && (
            <tfoot>
              <tr className="border-t-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                <td
                  colSpan={3}
                  className="px-5 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  Total
                </td>
                <td className="px-5 py-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {distributionAmount.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
        </div>
      </div>
    </div>
  );
}
