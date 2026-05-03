"use client";

import { useState } from "react";
import { getCooperativeOverview } from "@/app/actions/reports";
import type { CoopOverviewData } from "@/app/actions/reports";

export function ExportPdfButton({
  cooperativeId,
  cooperativeName,
}: {
  cooperativeId: string;
  cooperativeName: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const [data, { exportCooperativeReportPdf }] = await Promise.all([
        getCooperativeOverview(cooperativeId) as Promise<CoopOverviewData>,
        import("@/app/lib/pdf-export"),
      ]);
      exportCooperativeReportPdf(data, cooperativeName);
    } catch (err) {
      console.error("PDF export failed", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 hover:border-emerald-300 dark:hover:border-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Generating…" : "↓ Export PDF"}
    </button>
  );
}
