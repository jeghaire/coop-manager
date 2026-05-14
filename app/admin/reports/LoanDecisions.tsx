import { getLoanDecisions } from "./data";
import { Badge } from "@/components/ui/badge";

function LoanStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "emerald" | "red";
}) {
  const containerClass =
    accent === "emerald"
      ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
      : accent === "red"
        ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"
        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800/60";
  const valueClass =
    accent === "emerald"
      ? "text-emerald-800 dark:text-emerald-300"
      : accent === "red"
        ? "text-red-800 dark:text-red-300"
        : "text-zinc-900 dark:text-zinc-100";
  return (
    <div className={`rounded-xl p-5 border ${containerClass}`}>
      <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight ${valueClass}`}>
        {value}
      </p>
      {sub && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{sub}</p>
      )}
    </div>
  );
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export async function LoanDecisions({
  cooperativeId,
}: {
  cooperativeId: string;
}) {
  const data = await getLoanDecisions(cooperativeId);

  if (data.total === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-10 text-center">
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          No decided loans yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top-line stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <LoanStat label="Total Decided" value={data.total} />
        <LoanStat
          label="Approved"
          value={data.approvedCount}
          sub={`${data.approvalRate}% approval rate`}
          accent="emerald"
        />
        <LoanStat label="Rejected" value={data.rejectedCount} accent="red" />
        <LoanStat
          label="Total Approved Amount"
          value={data.totalApprovedAmount.toLocaleString()}
        />
      </div>

      {/* By reviewer */}
      {data.byReviewer.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Decisions by Admin
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead className="text-center">Approved</TableHead>
                <TableHead className="text-center">Rejected</TableHead>
                <TableHead className="text-right">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byReviewer.map((r) => {
                const total = r.approved + r.rejected;
                const rate =
                  total > 0 ? Math.round((r.approved / total) * 100) : 0;
                return (
                  <TableRow key={r.name}>
                    <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                      {r.name}
                    </TableCell>
                    <TableCell className="text-center text-primary">
                      {r.approved}
                    </TableCell>
                    <TableCell className="text-center text-destructive">
                      {r.rejected}
                    </TableCell>
                    <TableCell className="text-right text-zinc-600 dark:text-zinc-400">
                      {rate}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Rejection reasons */}
      {data.rejectionReasons.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Top Rejection Reasons
            </p>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.rejectionReasons.map(([reason, count]) => (
              <div
                key={reason}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <p className="text-sm text-zinc-700 dark:text-zinc-300 flex-1 min-w-0 truncate">
                  {reason}
                </p>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decision log */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b">
          <p className="text-sm font-semibold">Decision Log</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                Amount
              </TableHead>
              <TableHead className="text-center">Decision</TableHead>
              <TableHead className="hidden md:table-cell">
                Reviewed by
              </TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.loans.map((loan) => (
              <TableRow key={loan.id}>
                <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                  {loan.applicant.name}
                  {loan.status === "REJECTED" && loan.rejectionReason && (
                    <p className="text-xs text-muted-foreground font-normal truncate max-w-50">
                      {loan.rejectionReason}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-right hidden sm:table-cell">
                  {Number(loan.amountRequested).toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  {loan.status === "APPROVED" ? (
                    <Badge variant="success">Approved</Badge>
                  ) : (
                    <Badge variant="destructive">Rejected</Badge>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {loan.reviewer?.name ?? "—"}
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-xs hidden sm:table-cell">
                  {loan.reviewedAt
                    ? new Date(loan.reviewedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
