import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { TabNav } from "./TabNav";
import { FinancialReport } from "./FinancialReport";
import { LoanDecisions } from "./LoanDecisions";
import { DividendSnapshot } from "./DividendSnapshot";
import Link from "next/link";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; distribute?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "OWNER" && role !== "TREASURER") {
    redirect("/dashboard");
  }

  const { tab = "financial", distribute } = await searchParams;
  const cooperativeId = session.user.cooperativeId as string;
  const distributionAmount = distribute ? Math.max(0, Number(distribute)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Reports
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Financial overview, loan history, and dividend calculations
          </p>
        </div>
        <Link
          href={`/api/reports/csv?type=${tab === "dividends" ? "dividends" : tab === "loans" ? "loans" : "financial"}${distributionAmount > 0 ? `&distribute=${distributionAmount}` : ""}`}
          className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 hover:border-emerald-300 dark:hover:border-emerald-500/40"
        >
          ↓ Export CSV
        </Link>
      </div>

      <TabNav />

      <Suspense
        key={tab}
        fallback={
          <div className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-600">
            Loading…
          </div>
        }
      >
        {tab === "financial" && (
          <FinancialReport cooperativeId={cooperativeId} />
        )}
        {tab === "loans" && <LoanDecisions cooperativeId={cooperativeId} />}
        {tab === "dividends" && (
          <DividendSnapshot
            cooperativeId={cooperativeId}
            distributionAmount={distributionAmount}
          />
        )}
      </Suspense>
    </div>
  );
}
