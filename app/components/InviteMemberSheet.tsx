"use client";

import { useState } from "react";
import Link from "next/link";
import { BottomSheet } from "./BottomSheet";
import { InviteMemberForm } from "@/app/admin/members/invite/InviteMemberForm";
import { cn } from "@/app/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function InviteMemberSheet({ isOwner }: { isOwner: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile: opens sheet */}
      <button
        onClick={() => setOpen(true)}
        className={cn(buttonVariants({ size: "sm" }), "md:hidden")}
      >
        Invite Member
      </button>

      {/* Desktop: navigates to dedicated page */}
      <Link
        href="/admin/members/invite"
        className={cn(buttonVariants({ size: "sm" }), "hidden md:inline-flex")}
      >
        Invite Member
      </Link>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Invite Member">
        <InviteMemberForm isOwner={isOwner} />
      </BottomSheet>
    </>
  );
}
