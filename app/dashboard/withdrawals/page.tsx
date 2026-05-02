export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { getAvailableWithdrawal, getMemberWithdrawals } from "@/app/actions/withdrawals";
import { WithdrawalForm } from "./WithdrawalForm";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const STATUS_BADGE: Record<string, "secondary" | "success" | "destructive" | "outline"> = {
  REQUESTED: "secondary",
  APPROVED: "success",
  REJECTED: "destructive",
  PAID: "outline",
};

const REASON_LABEL: Record<string, string> = {
  PERSONAL: "Personal Use",
  EMERGENCY: "Emergency",
  LEAVING: "Leaving Cooperative",
  OTHER: "Other",
};

export default async function WithdrawalsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const cooperativeId = session.user.cooperativeId as string;

  const [withdrawals, available, cooperative] = await Promise.all([
    getMemberWithdrawals(cooperativeId),
    getAvailableWithdrawal(session.user.id, cooperativeId),
    prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { currencySymbol: true },
    }),
  ]);

  const sym = cooperative?.currencySymbol ?? "₦";
  const hasPending = withdrawals.some((w) => w.status === "REQUESTED");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Withdrawals
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Request a withdrawal from your contributions balance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Available to Withdraw
          </p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {sym}{available.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Total contributions minus active loan balance
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            New Request
          </h2>
          {available <= 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No available balance. You may have an active loan or no verified contributions.
              </AlertDescription>
            </Alert>
          ) : hasPending ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have a pending withdrawal request. Wait for it to be reviewed before submitting another.
              </AlertDescription>
            </Alert>
          ) : (
            <WithdrawalForm maxAmount={available} currencySymbol={sym} />
          )}
        </div>
      </div>

      {withdrawals.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Request History
          </h2>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                      Amount
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                      Reason
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                  {withdrawals.map((w) => (
                    <tr key={w.id}>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {sym}{Number(w.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {REASON_LABEL[w.reason] ?? w.reason}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge variant={STATUS_BADGE[w.status] ?? "secondary"}>
                            {w.status}
                          </Badge>
                          {w.status === "REJECTED" && w.rejectionReason && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              {w.rejectionReason}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
