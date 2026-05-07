"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, TrendingUp, Users, Settings } from "lucide-react";
import { cn } from "@/app/lib/utils";

const FINANCE_PREFIXES = [
  "/dashboard/financial-summary",
  "/dashboard/loans",
  "/dashboard/contributions",
  "/dashboard/transactions",
  "/dashboard/withdrawals",
  "/dashboard/billing",
];

const ADMIN_PREFIXES = [
  "/admin/members",
  "/admin/loans",
  "/admin/contributions",
  "/admin/withdrawals",
  "/admin/notifications",
  "/admin/treasurer",
  "/admin/dividends",
  "/admin/reports",
  "/admin/announcements",
  "/admin/settings",
];

export function BottomTabBar({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminRole = role === "ADMIN" || role === "OWNER" || role === "TREASURER";

  const membersHref = isAdminRole ? "/admin/members" : "/dashboard/cooperative-details";

  function isTabActive(id: "home" | "finance" | "members" | "settings"): boolean {
    switch (id) {
      case "home":
        return pathname === "/dashboard";
      case "finance":
        return FINANCE_PREFIXES.some((p) => pathname.startsWith(p));
      case "members":
        return isAdminRole
          ? ADMIN_PREFIXES.some((p) => pathname.startsWith(p))
          : pathname.startsWith("/dashboard/cooperative-details") ||
            pathname.startsWith("/dashboard/profile");
      case "settings":
        return pathname.startsWith("/dashboard/settings");
    }
  }

  function handleTabPress(href: string, id: "home" | "finance" | "members" | "settings") {
    if (isTabActive(id)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push(href);
    }
  }

  const tabs = [
    { id: "home" as const, label: "Home", href: "/dashboard", Icon: Home },
    { id: "finance" as const, label: "Finance", href: "/dashboard/financial-summary", Icon: TrendingUp },
    { id: "members" as const, label: "Members", href: membersHref, Icon: Users },
    { id: "settings" as const, label: "Settings", href: "/dashboard/settings", Icon: Settings },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#0c0c0c]/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800/60"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch">
        {tabs.map(({ id, label, href, Icon }) => {
          const active = isTabActive(id);
          return (
            <button
              key={id}
              onClick={() => handleTabPress(href, id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-14 transition-colors",
                active
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-400 dark:text-zinc-500"
              )}
              aria-label={label}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className="w-5 h-5"
                strokeWidth={active ? 2.5 : 1.75}
              />
              <span
                className={cn(
                  "text-[10px]",
                  active ? "font-semibold" : "font-medium"
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
