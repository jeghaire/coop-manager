"use client";

import { useState } from "react";
import Link from "next/link";
import { BottomSheet } from "./BottomSheet";
import { LoanApplicationForm } from "@/app/dashboard/loans/apply/LoanApplicationForm";
import { cn } from "@/app/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type Member = { id: string; name: string };

export function LoanApplySheet({
  members,
  borrowingCapacity,
  guarantorCoverageMode,
  canApply,
}: {
  members: Member[];
  borrowingCapacity: number;
  guarantorCoverageMode: string;
  canApply: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile: opens sheet */}
      <button
        onClick={() => setOpen(true)}
        disabled={!canApply}
        className={cn(buttonVariants({ size: "sm" }), "md:hidden")}
      >
        Apply for Loan
      </button>

      {/* Desktop: navigates to dedicated page */}
      <Link
        href="/dashboard/loans/apply"
        className={cn(buttonVariants({ size: "sm" }), "hidden md:inline-flex")}
      >
        Apply for Loan
      </Link>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Apply for Loan">
        <div className="space-y-4">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4">
            <p className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">
              Your Borrowing Capacity
            </p>
            <p className="text-2xl font-semibold text-emerald-800 dark:text-emerald-300">
              ₦{borrowingCapacity.toLocaleString()}
            </p>
          </div>
          <LoanApplicationForm
            members={members}
            borrowingCapacity={borrowingCapacity}
            guarantorCoverageMode={guarantorCoverageMode}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </BottomSheet>
    </>
  );
}
