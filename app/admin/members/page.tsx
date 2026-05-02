export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { RoleChangeForm, RemoveMemberForm } from "./MemberActions";
import { cn } from "@/app/lib/utils";

const ROLE_BADGE: Record<
  string,
  "success" | "sky" | "warning" | "secondary"
> = {
  OWNER: "success",
  ADMIN: "sky",
  TREASURER: "warning",
  MEMBER: "secondary",
};

export default async function AdminMembersPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "OWNER") redirect("/dashboard");

  const cooperativeId = session.user.cooperativeId as string;
  const isOwner = role === "OWNER";

  const members = await prisma.user.findMany({
    where: { cooperativeId, deletedAt: null },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      monthlyContributionAmount: true,
      joinedAt: true,
      createdAt: true,
      emailVerified: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Members
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {members.length} active member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/members/import"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Import CSV
          </Link>
          <Link
            href="/admin/members/invite"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Invite Member
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Member
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                Monthly (₦)
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Role
              </th>
              {isOwner && (
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {m.name}
                      {!m.emailVerified && (
                        <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-600">
                          (unverified)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {m.email}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-zinc-700 dark:text-zinc-300 font-mono text-sm">
                    {Number(m.monthlyContributionAmount).toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {isOwner && m.role !== "OWNER" ? (
                    <RoleChangeForm memberId={m.id} currentRole={m.role} />
                  ) : (
                    <Badge variant={ROLE_BADGE[m.role] ?? "secondary"}>
                      {m.role}
                    </Badge>
                  )}
                </td>
                {isOwner && (
                  <td className="px-4 py-3 text-right">
                    {m.role !== "OWNER" && m.id !== session.user.id && (
                      <RemoveMemberForm memberId={m.id} />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
