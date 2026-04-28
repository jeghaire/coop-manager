"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; badge?: number };

const memberLinks: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/loans", label: "My Loans" },
  { href: "/dashboard/contributions", label: "Contributions" },
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
    { href: "/admin/treasurer", label: "Manual Entry" },
    { href: "/admin/settings", label: "Settings" },
    { href: "/admin/reports", label: "Reports" },
  ];
}

const treasurerLinks: NavItem[] = [
  { href: "/admin/contributions", label: "Contributions" },
  { href: "/admin/treasurer", label: "Manual Entry" },
  { href: "/admin/reports", label: "Reports" },
];

export function DashboardNav({
  role,
  pendingLoans = 0,
}: {
  role: string;
  pendingLoans?: number;
}) {
  const pathname = usePathname();
  const isAdmin = role === "ADMIN" || role === "OWNER";
  const isTreasurer = role === "TREASURER";
  const isOwner = role === "OWNER";

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const navLinkClass = (href: string) =>
    cn(
      "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive(href)
        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
    );

  return (
    <nav className="flex flex-col gap-0.5">
      <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        Member
      </p>
      {memberLinks.map(({ href, label }) => (
        <Link key={href} href={href} className={navLinkClass(href)}>
          <span>{label}</span>
        </Link>
      ))}

      {(isAdmin || isTreasurer) && (
        <>
          <p className="px-3 mt-4 mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            {isTreasurer ? "Treasurer" : "Admin"}
          </p>
          {(isAdmin ? adminLinks(pendingLoans) : treasurerLinks).map(({ href, label, badge }) => (
            <Link key={href} href={href} className={navLinkClass(href)}>
              <span>{label}</span>
              {badge ? (
                <span className="inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold px-1">
                  {badge}
                </span>
              ) : null}
            </Link>
          ))}
        </>
      )}

      {isOwner && (
        <Link
          href="/dashboard/billing"
          className={navLinkClass("/dashboard/billing")}
        >
          <span>Billing</span>
        </Link>
      )}
    </nav>
  );
}
