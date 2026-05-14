export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { VerifyMemberForm } from "./VerifyMemberForm";
import { PageHeader } from "@/app/components/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function UnverifiedMembersPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "OWNER") redirect("/dashboard");

  const cooperativeId = session.user.cooperativeId as string;

  const unverifiedMembers = await prisma.user.findMany({
    where: {
      cooperativeId,
      deletedAt: null,
      verifiedAt: null,
      role: "MEMBER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unverified Members"
        description={`${unverifiedMembers.length} member${unverifiedMembers.length !== 1 ? "s" : ""} awaiting verification`}
      />

      {unverifiedMembers.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-10 text-center">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            All members are verified.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="hidden sm:table-cell">Signed Up</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unverifiedMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {member.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {member.email}
                    </p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-zinc-500 dark:text-zinc-400">
                    {new Date(member.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <VerifyMemberForm
                      memberId={member.id}
                      memberName={member.name}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
