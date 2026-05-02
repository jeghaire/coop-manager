"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/app/lib/utils";

const TABS = [
  { id: "financial", label: "Financial Summary" },
  { id: "loans", label: "Loan Decisions" },
  { id: "dividends", label: "Dividend Snapshot" },
];

export function TabNav() {
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? "financial";

  return (
    <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
      {TABS.map(({ id, label }) => (
        <Link
          key={id}
          href={`?tab=${id}`}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
            active === id
              ? "border-emerald-500 text-emerald-700 dark:text-emerald-400"
              : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
