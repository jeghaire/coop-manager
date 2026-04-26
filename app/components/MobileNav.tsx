"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; exact?: boolean };

const memberItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/loans", label: "Loans" },
  { href: "/dashboard/contributions", label: "Contributions" },
];

const adminItems: NavItem[] = [
  { href: "/admin/members", label: "Members" },
  { href: "/admin/loans", label: "Loans" },
  { href: "/admin/contributions", label: "Contribs" },
  { href: "/admin/reports", label: "Reports" },
];

const treasurerItems: NavItem[] = [
  { href: "/admin/contributions", label: "Contribs" },
  { href: "/admin/reports", label: "Reports" },
];

export function MobileNav({ role }: { role: string }) {
  const pathname = usePathname();

  const isAdmin = role === "ADMIN" || role === "OWNER";
  const isTreasurer = role === "TREASURER";

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const allItems: NavItem[] = [
    ...memberItems,
    ...(isAdmin ? adminItems : isTreasurer ? treasurerItems : []),
  ];

  // Show at most 5 items; truncate from admin end if too many
  const items = allItems.slice(0, 5);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex safe-bottom">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-2.5 text-[10px] font-medium leading-tight gap-1 transition-colors min-w-0",
            isActive(item)
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-zinc-500 dark:text-zinc-500"
          )}
        >
          <span
            className={cn(
              "w-6 h-0.5 rounded-full transition-all",
              isActive(item)
                ? "bg-emerald-500"
                : "bg-transparent"
            )}
          />
          <span className="truncate w-full text-center px-1">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
