import { getLoanDecisions } from "./data";
import { Badge } from "@/components/ui/badge";

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
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-4">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1">
            Total Decided
          </p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {data.total}
          </p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-1">
            Approved
          </p>
          <p className="text-2xl font-semibold text-emerald-800 dark:text-emerald-300">
            {data.approvedCount}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
            {data.approvalRate}% approval rate
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-red-600 dark:text-red-500 mb-1">
            Rejected
          </p>
          <p className="text-2xl font-semibold text-red-800 dark:text-red-300">
            {data.rejectedCount}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-4">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1">
            Total Approved (₦)
          </p>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {data.totalApprovedAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* By reviewer */}
      {data.byReviewer.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Decisions by Admin
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Admin
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Approved
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Rejected
                </th>
                <th className="text-right px-5 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.byReviewer.map((r) => {
                const total = r.approved + r.rejected;
                const rate =
                  total > 0 ? Math.round((r.approved / total) * 100) : 0;
                return (
                  <tr key={r.name}>
                    <td className="px-5 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {r.name}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="success">{r.approved}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="destructive">{r.rejected}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-600 dark:text-zinc-400">
                      {rate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Decision Log
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Applicant
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                Amount (₦)
              </th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Decision
              </th>
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                Reviewed by
              </th>
              <th className="text-right px-5 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.loans.map((loan) => (
              <tr
                key={loan.id}
                className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20"
              >
                <td className="px-5 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  {loan.applicant.name}
                  {loan.status === "REJECTED" && loan.rejectionReason && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-600 font-normal truncate max-w-[200px]">
                      {loan.rejectionReason}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono text-zinc-700 dark:text-zinc-300 hidden sm:table-cell">
                  {Number(loan.amountRequested).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  {loan.status === "APPROVED" ? (
                    <Badge variant="success">Approved</Badge>
                  ) : (
                    <Badge variant="destructive">Rejected</Badge>
                  )}
                </td>
                <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400 hidden md:table-cell">
                  {loan.reviewer?.name ?? "—"}
                </td>
                <td className="px-5 py-3 text-right text-zinc-500 dark:text-zinc-500 text-xs hidden sm:table-cell">
                  {loan.reviewedAt
                    ? new Date(loan.reviewedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
