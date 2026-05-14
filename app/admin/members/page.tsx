export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { RoleChangeForm, RemoveMemberForm } from "./MemberActions";
import { cn } from "@/app/lib/utils";
import Link from "next/link";
import { PageHeader } from "@/app/components/PageHeader";
import { InviteMemberSheet } from "@/app/components/InviteMemberSheet";
import {
  Table,
  TableBody,
  TableCell,
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
      <PageHeader
        title="Members"
        description={`${members.length} active member${members.length !== 1 ? "s" : ""}`}
        action={
          <div className="flex gap-2">
            <Link
              href="/admin/members/import"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Import CSV
            </Link>
            <InviteMemberSheet isOwner={isOwner} />
          </div>
        }
      />

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead className="hidden sm:table-cell">Monthly</TableHead>
              <TableHead>Role</TableHead>
              {isOwner && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {m.name}
                      {!m.emailVerified && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (unverified)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {m.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-zinc-700 dark:text-zinc-300 font-mono text-sm">
                    {Number(m.monthlyContributionAmount).toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  {isOwner && m.role !== "OWNER" ? (
                    <RoleChangeForm memberId={m.id} currentRole={m.role} />
                  ) : (
                    <Badge
                      variant={ROLE_BADGE[m.role] ?? "secondary"}
                      className="capitalize py-0.5 px-2 text-xs"
                    >
                      {m.role.toLowerCase()}
                    </Badge>
                  )}
                </TableCell>
                {isOwner && (
                  <TableCell className="text-right">
                    {m.role !== "OWNER" && m.id !== session.user.id && (
                      <RemoveMemberForm memberId={m.id} />
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
