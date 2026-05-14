import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { getDividendSnapshot } from "./data";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  currencySymbol,
}: {
  cooperativeId: string;
  distributionAmount: number;
  currencySymbol: string;
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
          <p className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 mb-1">
            Total Fund
          </p>
          <p className="text-2xl font-semibold text-emerald-800 dark:text-emerald-300">
            {currencySymbol}
            {grandTotal.toLocaleString()}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
            Verified contributions
          </p>
        </div>

        {distributionAmount > 0 && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-4 flex-1 min-w-50">
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Distribution Amount
            </p>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {currencySymbol}
              {distributionAmount.toLocaleString()}
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
          <code className="font-mono text-xs">
            ?tab=dividends&distribute=500000
          </code>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                Contributed
              </TableHead>
              <TableHead className="text-right">Share %</TableHead>
              {distributionAmount > 0 && (
                <TableHead className="text-right">Dividend</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => {
              const dividend =
                distributionAmount > 0
                  ? (row.percentage / 100) * distributionAmount
                  : 0;
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                          {row.name}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
                          {row.email}
                        </p>
                      </div>
                      <Badge
                        variant={ROLE_BADGE[row.role] ?? "secondary"}
                        className="hidden md:inline-flex text-[10px] ml-auto"
                      >
                        {row.role}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-zinc-700 dark:text-zinc-300 hidden sm:table-cell">
                    {currencySymbol}
                    {row.totalContributed.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Progress
                        value={row.percentage}
                        className="flex-1 max-w-25"
                      ></Progress>
                      <span className="w-14 shrink-0 text-right text-zinc-700 dark:text-zinc-300 text-sm tabular-nums">
                        {row.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  {distributionAmount > 0 && (
                    <TableCell className="text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                      {currencySymbol}
                      {Math.round(dividend).toLocaleString()}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
          {distributionAmount > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Total
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {currencySymbol}
                  {distributionAmount.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
