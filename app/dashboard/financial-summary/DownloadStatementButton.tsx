"use client";

import { useState } from "react";
import { getMemberFinancialSummary } from "@/app/actions/reports";
import type { MemberSummaryData } from "@/app/actions/reports";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/app/lib/utils";

export function DownloadStatementButton({
  cooperativeId,
  userId,
  cooperativeName,
}: {
  cooperativeId: string;
  userId: string;
  cooperativeName: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const [data, { exportMemberStatementPdf }] = await Promise.all([
        getMemberFinancialSummary(
          cooperativeId,
          userId
        ) as Promise<MemberSummaryData>,
        import("@/app/lib/pdf-export"),
      ]);
      exportMemberStatementPdf(data, cooperativeName);
    } catch (err) {
      console.error("PDF export failed", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      {loading ? "Generating…" : "↓ Download Statement (PDF)"}
    </button>
  );
}
