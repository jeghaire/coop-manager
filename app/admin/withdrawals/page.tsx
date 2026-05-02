export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import { getAllWithdrawals } from "@/app/actions/withdrawals";
import { Badge } from "@/components/ui/badge";
import { ApproveForm, RejectForm, MarkPaidForm } from "./WithdrawalActions";
import prisma from "@/app/lib/prisma";

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

export default async function AdminWithdrawalsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "OWNER") redirect("/dashboard");

  const cooperativeId = session.user.cooperativeId as string;

  const [withdrawals, cooperative] = await Promise.all([
    getAllWithdrawals(cooperativeId),
    prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { currencySymbol: true },
    }),
  ]);

  const sym = cooperative?.currencySymbol ?? "₦";

  const pending = withdrawals.filter((w) => w.status === "REQUESTED");
  const others = withdrawals.filter((w) => w.status !== "REQUESTED");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Withdrawal Requests
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          {pending.length} pending · {withdrawals.length} total
        </p>
      </div>

      {withdrawals.length === 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-12 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No withdrawal requests yet
          </p>
        </div>
      )}

      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            Pending Review
          </h2>
          <div className="space-y-3">
            {pending.map((w) => (
              <div
                key={w.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                        {sym}{Number(w.amount).toLocaleString()}
                      </span>
                      <Badge variant="secondary">REQUESTED</Badge>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {w.user.name}{" "}
                      <span className="text-zinc-400 dark:text-zinc-600">
                        ({w.user.email})
                      </span>
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Reason: {REASON_LABEL[w.reason] ?? w.reason}
                    </p>
                    {w.notes && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Notes: {w.notes}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-2">
                      Requested {new Date(w.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 min-w-[120px]">
                    <ApproveForm withdrawalId={w.id} />
                    <RejectForm withdrawalId={w.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            History
          </h2>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                      Member
                    </th>
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
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                  {others.map((w) => (
                    <tr key={w.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {w.user.name}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {w.user.email}
                        </p>
                      </td>
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
                      <td className="px-4 py-3">
                        {w.status === "APPROVED" && (
                          <MarkPaidForm withdrawalId={w.id} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
