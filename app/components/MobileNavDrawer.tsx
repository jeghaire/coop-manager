"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Building2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type NavItem = { href: string; label: string; badge?: number };

const memberLinks: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/financial-summary", label: "Financial Summary" },
  { href: "/dashboard/loans", label: "My Loans" },
  { href: "/dashboard/contributions", label: "Contributions" },
  { href: "/dashboard/withdrawals", label: "Withdrawals" },
  { href: "/dashboard/transactions", label: "Transactions" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/cooperative-details", label: "Cooperative" },
  { href: "/dashboard/settings", label: "Settings" },
];

function adminLinks(pendingLoans: number): NavItem[] {
  return [
    { href: "/admin/members", label: "Members" },
    { href: "/admin/members/unverified", label: "Unverified" },
    { href: "/admin/loans", label: "Pending Loans" },
    { href: "/admin/notifications", label: "Notifications", badge: pendingLoans || undefined },
    { href: "/admin/contributions", label: "Contributions" },
    { href: "/admin/withdrawals", label: "Withdrawals" },
    { href: "/admin/treasurer", label: "Manual Entry" },
    { href: "/admin/dividends", label: "Dividends" },
    { href: "/admin/settings", label: "Settings" },
    { href: "/admin/reports", label: "Reports" },
  ];
}

const treasurerLinks: NavItem[] = [
  { href: "/admin/contributions", label: "Contributions" },
  { href: "/admin/treasurer", label: "Manual Entry" },
  { href: "/admin/reports", label: "Reports" },
];

export function MobileNavDrawer({
  role,
  pendingLoans = 0,
}: {
  role: string;
  pendingLoans?: number;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = role === "ADMIN" || role === "OWNER";
  const isTreasurer = role === "TREASURER";
  const isOwner = role === "OWNER";

  const allLinks = [...memberLinks, ...adminLinks(pendingLoans), ...treasurerLinks];
  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    if (!pathname.startsWith(href)) return false;
    return !allLinks.some(
      (l) => l.href !== href && l.href.startsWith(href + "/") && pathname.startsWith(l.href)
    );
  };

  const linkClass = (href: string) =>
    cn(
      "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full",
      isActive(href)
        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
    );

  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="md:hidden -ml-1.5 p-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" strokeWidth={1.75} />
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-72 p-0 flex flex-col bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800/60"
      >
        <div className="flex items-center gap-2.5 px-4 h-16 border-b border-zinc-200 dark:border-zinc-800/60 shrink-0">
          <div className="w-7 h-7 bg-emerald-600 dark:bg-emerald-500 rounded-md flex items-center justify-center shadow-sm">
            <Building2 className="w-4 h-4 text-white" strokeWidth={1.75} />
          </div>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight text-base">
            Cooperative Manager
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5">
          <div className="flex flex-col gap-0.5">
            <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
              Member
            </p>
            {memberLinks.map(({ href, label }) => (
              <Link key={href} href={href} className={linkClass(href)} onClick={close}>
                {label}
              </Link>
            ))}
          </div>

          {(isAdmin || isTreasurer) && (
            <div className="flex flex-col gap-0.5">
              <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                {isTreasurer ? "Treasurer" : "Admin"}
              </p>
              {(isAdmin ? adminLinks(pendingLoans) : treasurerLinks).map(
                ({ href, label, badge }) => (
                  <Link key={href} href={href} className={linkClass(href)} onClick={close}>
                    <span>{label}</span>
                    {badge ? (
                      <span className="inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold px-1">
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                )
              )}
            </div>
          )}

          {isOwner && (
            <div className="flex flex-col gap-0.5">
              <Link
                href="/dashboard/billing"
                className={linkClass("/dashboard/billing")}
                onClick={close}
              >
                Billing
              </Link>
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
