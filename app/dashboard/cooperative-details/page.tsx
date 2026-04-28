export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";

export default async function CooperativeDetailsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const cooperativeId = session.user.cooperativeId as string;

  const [cooperative, memberStats] = await Promise.all([
    prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      include: {
        bankAccounts: { orderBy: { isPreferred: "desc" } },
      },
    }),
    prisma.user.findMany({
      where: { cooperativeId, deletedAt: null },
      select: { verifiedAt: true },
    }),
  ]);

  if (!cooperative) redirect("/dashboard");

  const totalMembers = memberStats.length;
  const verifiedMembers = memberStats.filter((m) => m.verifiedAt).length;

  const totalContributions = await prisma.contribution.aggregate({
    where: { cooperativeId, status: "VERIFIED", deletedAt: null },
    _sum: { amount: true },
  });
  const contributionTotal = Number(totalContributions._sum.amount ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {cooperative.name}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Cooperative details and bank accounts
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-5">
          <p className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-2">
            Total Members
          </p>
          <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{totalMembers}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-5">
          <p className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-2">
            Verified Members
          </p>
          <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{verifiedMembers}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-5">
          <p className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-2">
            Total Contributions
          </p>
          <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            ₦{contributionTotal.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Bank Accounts */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Bank Accounts</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Use these accounts for contributions
          </p>
        </div>

        {cooperative.bankAccounts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No bank accounts configured yet.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Account Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                  Account Number
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Bank
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {cooperative.bankAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {account.accountName}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-mono hidden sm:table-cell">
                    {account.accountNumber}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {account.bankName}
                  </td>
                  <td className="px-4 py-3">
                    {account.isPreferred ? (
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">✓ Preferred</span>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-600 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
