"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

const memberLinks: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/loans", label: "My Loans" },
  { href: "/dashboard/contributions", label: "Contributions" },
  { href: "/dashboard/settings", label: "Settings" },
];

const adminLinks: NavItem[] = [
  { href: "/admin/members", label: "Members" },
  { href: "/admin/loans", label: "Pending Loans" },
  { href: "/admin/contributions", label: "Contributions" },
  { href: "/admin/reports", label: "Reports" },
];

const treasurerLinks: NavItem[] = [
  { href: "/admin/contributions", label: "Contributions" },
  { href: "/admin/reports", label: "Reports" },
];

export function DashboardNav({ role }: { role: string }) {
  const pathname = usePathname();
  const isAdmin = role === "ADMIN" || role === "OWNER";
  const isTreasurer = role === "TREASURER";
  const isOwner = role === "OWNER";

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <nav className="flex flex-col gap-0.5">
      <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        Member
      </p>
      {memberLinks.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(href)
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
          )}
        >
          {label}
        </Link>
      ))}

      {(isAdmin || isTreasurer) && (
        <>
          <p className="px-3 mt-4 mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            {isTreasurer ? "Treasurer" : "Admin"}
          </p>
          {(isAdmin ? adminLinks : treasurerLinks).map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
              )}
            >
              {label}
            </Link>
          ))}
        </>
      )}

      {isOwner && (
        <Link
          href="/dashboard/billing"
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 mt-4 text-sm font-medium transition-colors",
            isActive("/dashboard/billing")
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
          )}
        >
          Billing
        </Link>
      )}
    </nav>
  );
}
