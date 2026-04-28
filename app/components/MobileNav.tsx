"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Wallet, HandCoins, User, Users, LayoutDashboard, Settings, Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const memberItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home, exact: true },
  { href: "/dashboard/loans", label: "Loans", icon: HandCoins },
  { href: "/dashboard/contributions", label: "Savings", icon: Wallet },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

const adminItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/loans", label: "Loans", icon: HandCoins },
  { href: "/admin/notifications", label: "Alerts", icon: Bell },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const treasurerItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/contributions", label: "Contribs", icon: Wallet },
  { href: "/admin/treasurer", label: "Entry", icon: HandCoins },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export function MobileNav({ role }: { role: string }) {
  const pathname = usePathname();

  const isAdmin = role === "ADMIN" || role === "OWNER";
  const isTreasurer = role === "TREASURER";

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const items = isAdmin
    ? adminItems.slice(0, 5)
    : isTreasurer
    ? treasurerItems
    : memberItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex safe-bottom">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2.5 text-[10px] font-medium leading-tight gap-1 transition-colors min-w-0",
              active
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-zinc-400 dark:text-zinc-500"
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5 shrink-0",
                active ? "stroke-emerald-500" : "stroke-zinc-400 dark:stroke-zinc-500"
              )}
              strokeWidth={active ? 2.5 : 1.75}
            />
            <span className="truncate w-full text-center px-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
