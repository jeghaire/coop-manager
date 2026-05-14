export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { getCurrencySymbol } from "@/app/lib/currency";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/app/components/PageHeader";
import { cn } from "@/app/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function TransactionsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const userId = session.user.id;
  const cooperativeId = session.user.cooperativeId as string;

  const [cooperative, contributions, loans] = await Promise.all([
    prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { currency: true },
    }),
    prisma.contribution.findMany({
      where: { userId, cooperativeId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    prisma.loanApplication.findMany({
      where: { userId, cooperativeId, deletedAt: null },
      include: { repayments: { orderBy: { paidAt: "desc" } } },
    }),
  ]);

  if (!cooperative) redirect("/dashboard");

  const sym = getCurrencySymbol(cooperative.currency);

  type TxRow = {
    date: Date;
    kind: "contribution" | "repayment";
    amount: number;
    status: string;
    ref: string;
  };

  const rows: TxRow[] = [];

  for (const c of contributions) {
    rows.push({
      date: c.createdAt,
      kind: "contribution",
      amount: Number(c.amount),
      status: c.status,
      ref: c.id.slice(-8),
    });
  }

  for (const loan of loans) {
    for (const r of loan.repayments) {
      rows.push({
        date: r.paidAt,
        kind: "repayment",
        amount: Number(r.amount),
        status: "RECORDED",
        ref: loan.id.slice(-8),
      });
    }
  }

  rows.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      <PageHeader
        title={"Transactions"}
        description={`${rows.length} transaction${rows.length !== 1 ? "s" : ""}`}
        action={
          <Link
            href="/dashboard/financial-summary"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "hidden md:inline-flex",
            )}
          >
            ← Summary
          </Link>
        }
      />

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
            No transactions yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Ref</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((tx, i) => (
                <TableRow key={i}>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">
                    {tx.date.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tx.kind === "contribution" ? "default" : "secondary"
                      }
                    >
                      {tx.kind === "contribution" ? "Contribution" : "Repayment"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-zinc-900 dark:text-zinc-100">
                    {sym}
                    {tx.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={tx.status} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-400 hidden sm:table-cell">
                    ...{tx.ref}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "VERIFIED":
    case "RECORDED":
      return <Badge variant="success">Verified</Badge>;
    case "PENDING_VERIFICATION":
      return <Badge variant="outline">Pending</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
