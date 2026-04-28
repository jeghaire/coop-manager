export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { Badge } from "@/components/ui/badge";

const ROLE_BADGE: Record<string, "success" | "sky" | "warning" | "secondary"> = {
  OWNER: "success",
  ADMIN: "sky",
  TREASURER: "warning",
  MEMBER: "secondary",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      role: true,
      verifiedAt: true,
      monthlyContributionAmount: true,
      createdAt: true,
      cooperative: { select: { name: true } },
      contributions: {
        where: { status: "VERIFIED", deletedAt: null },
        select: { amount: true },
      },
    },
  });

  if (!user) redirect("/auth/signin");

  const isVerified = !!user.verifiedAt;
  const totalContributed = user.contributions.reduce(
    (sum, c) => sum + Number(c.amount),
    0
  );

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          My Profile
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Your membership information
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Account
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant={ROLE_BADGE[user.role] ?? "secondary"}>{user.role}</Badge>
            {isVerified ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Verified</span>
            ) : (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Pending verification</span>
            )}
          </div>
        </div>

        <dl className="space-y-3">
          <div className="flex justify-between text-sm">
            <dt className="text-zinc-500 dark:text-zinc-400">Name</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">{user.name}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">{user.email}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-zinc-500 dark:text-zinc-400">Cooperative</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">{user.cooperative.name}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-zinc-500 dark:text-zinc-400">Member since</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {new Date(user.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>
        </dl>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          Contributions
        </h2>
        <dl className="space-y-3">
          <div className="flex justify-between text-sm">
            <dt className="text-zinc-500 dark:text-zinc-400">Total verified</dt>
            <dd className="font-semibold text-emerald-700 dark:text-emerald-400">
              ₦{totalContributed.toLocaleString()}
            </dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-zinc-500 dark:text-zinc-400">Monthly target</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              ₦{Number(user.monthlyContributionAmount).toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>

      {!isVerified && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Profile editing is available once your account is verified.
        </p>
      )}
    </div>
  );
}
