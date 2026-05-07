"use client";

import { useState } from "react";
import Link from "next/link";
import { BottomSheet } from "./BottomSheet";
import { ContributionSubmitForm } from "@/app/dashboard/contributions/submit/ContributionSubmitForm";
import { cn } from "@/app/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function ContributionSubmitSheet() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile: opens sheet */}
      <button
        onClick={() => setOpen(true)}
        className={cn(buttonVariants({ size: "sm" }), "md:hidden")}
      >
        Submit Contribution
      </button>

      {/* Desktop: navigates to dedicated page */}
      <Link
        href="/dashboard/contributions/submit"
        className={cn(buttonVariants({ size: "sm" }), "hidden md:inline-flex")}
      >
        Submit Contribution
      </Link>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Submit Contribution"
      >
        <ContributionSubmitForm onSuccess={() => setOpen(false)} />
      </BottomSheet>
    </>
  );
}
