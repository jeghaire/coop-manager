import { getFinancialSummary } from "./data";

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-5 border ${
        accent
          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800/60"
      }`}
    >
      <p className="text-xs font-mono font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2">
        {label}
      </p>
      <p
        className={`text-2xl font-semibold tracking-tight ${
          accent
            ? "text-emerald-800 dark:text-emerald-300"
            : "text-zinc-900 dark:text-zinc-100"
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{sub}</p>
      )}
    </div>
  );
}

export async function FinancialReport({
  cooperativeId,
}: {
  cooperativeId: string;
}) {
  const data = await getFinancialSummary(cooperativeId);

  const fmt = (n: number) => `₦${n.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat
          label="Total Contributed"
          value={fmt(data.totalVerified)}
          sub={`${data.verifiedCount} verified payment${data.verifiedCount !== 1 ? "s" : ""}`}
          accent
        />
        <Stat
          label="Total Loaned Out"
          value={fmt(data.totalLoaned)}
          sub={`${data.loanedCount} approved loan${data.loanedCount !== 1 ? "s" : ""}`}
        />
        <Stat
          label="Available Funds"
          value={fmt(data.availableFunds)}
          sub="Contributions minus approved loans"
          accent={data.availableFunds > 0}
        />
        <Stat
          label="Pending Contributions"
          value={fmt(data.pendingAmount)}
          sub={`${data.pendingCount} awaiting verification`}
        />
        <Stat
          label="Loans in Pipeline"
          value={String(data.activeLoans)}
          sub="Awaiting guarantors or admin review"
        />
        <Stat
          label="Monthly Target"
          value={fmt(data.monthlyTarget)}
          sub={`Across ${data.totalMembers} active member${data.totalMembers !== 1 ? "s" : ""}`}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-5">
        <p className="text-xs font-mono font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-4">
          Fund Health
        </p>
        <div className="space-y-3">
          <FundBar
            label="Contributions"
            amount={data.totalVerified}
            total={data.totalVerified}
            color="emerald"
          />
          <FundBar
            label="Loaned Out"
            amount={data.totalLoaned}
            total={data.totalVerified}
            color="amber"
          />
          <FundBar
            label="Available"
            amount={Math.max(0, data.availableFunds)}
            total={data.totalVerified}
            color="sky"
          />
        </div>
      </div>
    </div>
  );
}

function FundBar({
  label,
  amount,
  total,
  color,
}: {
  label: string;
  amount: number;
  total: number;
  color: "emerald" | "amber" | "sky";
}) {
  const pct = total > 0 ? Math.min(100, (amount / total) * 100) : 0;

  const trackColor = {
    emerald: "bg-emerald-100 dark:bg-emerald-500/20",
    amber: "bg-amber-100 dark:bg-amber-500/20",
    sky: "bg-sky-100 dark:bg-sky-500/20",
  }[color];

  const barColor = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    sky: "bg-sky-500",
  }[color];

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-zinc-600 dark:text-zinc-400 font-medium">
          {label}
        </span>
        <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
          ₦{amount.toLocaleString()}{" "}
          <span className="text-zinc-400 dark:text-zinc-600 font-normal">
            ({pct.toFixed(1)}%)
          </span>
        </span>
      </div>
      <div className={`h-2 rounded-full w-full ${trackColor}`}>
        <div
          className={`h-2 rounded-full ${barColor} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
