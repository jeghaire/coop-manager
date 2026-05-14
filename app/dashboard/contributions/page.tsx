export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { getPublicUrl } from "@/app/lib/s3-upload";
import { PageHeader } from "@/app/components/PageHeader";
import { ContributionSubmitSheet } from "@/app/components/ContributionSubmitSheet";
import { getCurrencySymbol } from "@/app/lib/currency";
import { ContributionList } from "./ContributionList";
import type { ContributionItem } from "@/app/actions/contributions";

const PAGE_SIZE = 6;

export default async function ContributionsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const userId = session.user.id;
  const cooperativeId = session.user.cooperativeId as string;

  const [raw, verifiedAgg, cooperative] = await Promise.all([
    prisma.contribution.findMany({
      where: { userId, cooperativeId, deletedAt: null },
      orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE + 1,
    }),
    prisma.contribution.aggregate({
      where: { userId, cooperativeId, status: "VERIFIED", deletedAt: null },
      _sum: { amount: true },
    }),
    prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { currency: true },
    }),
  ]);

  const hasMore = raw.length > PAGE_SIZE;
  const initialItems: ContributionItem[] = raw.slice(0, PAGE_SIZE).map((c) => ({
    id: c.id,
    amount: Number(c.amount),
    submittedAt: c.submittedAt.toISOString(),
    status: c.status,
    paymentMethod: c.paymentMethod,
    receiptUrl: c.receiptKey ? getPublicUrl(c.receiptKey) : (c.receiptUrl ?? null),
    receiptFileType: c.receiptFileType ?? null,
    receiptFileName: c.receiptFileName ?? null,
    rejectionReason: c.rejectionReason ?? null,
  }));

  const verifiedTotal = Number(verifiedAgg._sum.amount ?? 0);

  const sym = getCurrencySymbol(cooperative?.currency ?? "NGN");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Contributions"
        description="Track your monthly contribution history"
        action={<ContributionSubmitSheet currencySymbol={sym} />}
      />

      {/* Verified total */}
      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-5">
        <p className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-1">
          Total Verified
        </p>
        <p className="text-3xl font-semibold text-emerald-800 dark:text-emerald-300">
          {sym}
          {verifiedTotal.toLocaleString()}
        </p>
      </div>

      {/* Contribution list */}
      {initialItems.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-8 text-center">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            No contributions yet.
          </p>
        </div>
      ) : (
        <ContributionList
          initialItems={initialItems}
          initialHasMore={hasMore}
          currencySymbol={sym}
        />
      )}
    </div>
  );
}
