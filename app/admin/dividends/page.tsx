export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { getCurrencySymbol } from "@/app/lib/currency";
import { Badge } from "@/components/ui/badge";
import { NewDividendForm } from "./NewDividendForm";
import { ApproveButton, ProcessButton } from "./DividendActions";
import { PageHeader } from "@/app/components/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DividendsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "OWNER") redirect("/dashboard");

  const cooperativeId = session.user.cooperativeId as string;

  const [cooperative, payouts] = await Promise.all([
    prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { currency: true },
    }),
    prisma.dividendPayout.findMany({
      where: { cooperativeId },
      orderBy: { createdAt: "desc" },
      include: {
        memberDividends: { select: { id: true, amount: true, status: true } },
      },
    }),
  ]);

  if (!cooperative) redirect("/dashboard");
  const sym = getCurrencySymbol(cooperative.currency);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dividend Management"
        description="Distribute cooperative profits to members based on contribution share"
        action={
          <NewDividendForm cooperativeId={cooperativeId} currencySymbol={sym} />
        }
      />

      {payouts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-8 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No dividend payouts yet. Create one above to get started.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Payout History
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Total Profit</TableHead>
                <TableHead className="text-right">Pool</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                    {payout.period} {payout.year}
                  </TableCell>
                  <TableCell className="text-right text-zinc-600 dark:text-zinc-400">
                    {sym}
                    {Number(payout.totalProfit).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {sym}
                    {Number(payout.dividendPool).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center text-zinc-600 dark:text-zinc-400">
                    {payout.totalMembers}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={payout.status} />
                  </TableCell>
                  <TableCell>
                    {payout.status === "PENDING" && (
                      <ApproveButton
                        payoutId={payout.id}
                        cooperativeId={cooperativeId}
                      />
                    )}
                    {payout.status === "APPROVED" && (
                      <ProcessButton
                        payoutId={payout.id}
                        cooperativeId={cooperativeId}
                      />
                    )}
                    {payout.status === "PAID" && (
                      <Badge className="text-[10px] text-zinc-400">
                        {payout.paidAt
                          ? `Paid ${payout.paidAt.toLocaleDateString()}`
                          : "Paid"}
                      </Badge>
                    )}
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

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="outline" className="text-[10px]">
          Pending
        </Badge>
      );
    case "APPROVED":
      return <Badge variant="sky">Approved</Badge>;
    case "PAID":
      return <Badge className="text-[10px]">Paid</Badge>;
    default:
      return (
        <Badge variant="secondary" className="text-[10px]">
          {status}
        </Badge>
      );
  }
}
