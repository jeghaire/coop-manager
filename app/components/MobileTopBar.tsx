"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Home";
  if (pathname.startsWith("/dashboard/loans/apply")) return "Apply for Loan";
  if (/^\/dashboard\/loans\/[^/]+/.test(pathname)) return "Loan Details";
  if (pathname.startsWith("/dashboard/loans")) return "Loans";
  if (pathname.startsWith("/dashboard/contributions/submit")) return "Submit Contribution";
  if (pathname.startsWith("/dashboard/contributions")) return "Contributions";
  if (pathname.startsWith("/dashboard/financial-summary")) return "Finance";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  if (pathname.startsWith("/dashboard/profile")) return "Profile";
  if (pathname.startsWith("/dashboard/transactions")) return "Transactions";
  if (pathname.startsWith("/dashboard/withdrawals")) return "Withdrawals";
  if (pathname.startsWith("/dashboard/cooperative-details")) return "Cooperative";
  if (pathname.startsWith("/dashboard/announcements")) return "Announcements";
  if (pathname.startsWith("/dashboard/billing")) return "Billing";
  if (pathname.startsWith("/admin/members/invite")) return "Invite Member";
  if (pathname.startsWith("/admin/members/unverified")) return "Unverified Members";
  if (pathname.startsWith("/admin/members/import")) return "Import Members";
  if (pathname.startsWith("/admin/members")) return "Members";
  if (pathname.startsWith("/admin/loans")) return "Loan Reviews";
  if (pathname.startsWith("/admin/contributions")) return "Contributions";
  if (pathname.startsWith("/admin/withdrawals")) return "Withdrawals";
  if (pathname.startsWith("/admin/treasurer")) return "Manual Entry";
  if (pathname.startsWith("/admin/dividends")) return "Dividends";
  if (pathname.startsWith("/admin/settings")) return "Settings";
  if (pathname.startsWith("/admin/reports")) return "Reports";
  if (pathname.startsWith("/admin/notifications")) return "Notifications";
  if (pathname.startsWith("/admin/announcements")) return "Announcements";
  return "Cooperative Manager";
}

function getBackInfo(pathname: string): { href: string; label: string } | null {
  if (/^\/dashboard\/loans\/[^/]+(\/.*)?$/.test(pathname)) {
    return { href: "/dashboard/loans", label: "Loans" };
  }
  if (pathname.startsWith("/dashboard/contributions/submit")) {
    return { href: "/dashboard/contributions", label: "Contributions" };
  }
  if (
    pathname.startsWith("/admin/members/invite") ||
    pathname.startsWith("/admin/members/unverified") ||
    pathname.startsWith("/admin/members/import")
  ) {
    return { href: "/admin/members", label: "Members" };
  }
  return null;
}

export function MobileTopBar() {
  const pathname = usePathname();
  const [titleVisible, setTitleVisible] = useState(true);

  useEffect(() => {
    setTitleVisible(true);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ visible: boolean }>).detail;
      setTitleVisible(detail.visible);
    };
    window.addEventListener("page-title-visible", handler);
    return () => window.removeEventListener("page-title-visible", handler);
  }, []);

  const backInfo = getBackInfo(pathname);
  const title = getPageTitle(pathname);

  return (
    <header className="md:hidden sticky top-0 z-50 bg-white/90 dark:bg-[#0c0c0c]/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/60 h-12 flex items-center px-2">
      {/* Left: back button or spacer */}
      <div className="flex-1 flex items-center">
        {backInfo ? (
          <Link
            href={backInfo.href}
            className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 min-h-11 pr-2"
          >
            <ChevronLeft className="w-5 h-5 shrink-0" strokeWidth={2} />
            <span className="text-sm font-medium">{backInfo.label}</span>
          </Link>
        ) : (
          <div className="min-w-11" />
        )}
      </div>

      {/* Centre: compact title fades in when large title scrolls away */}
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none px-16 text-center">
        <span
          className={`text-sm font-semibold text-zinc-900 dark:text-zinc-100 transition-opacity duration-200 whitespace-nowrap ${
            titleVisible ? "opacity-0" : "opacity-100"
          }`}
        >
          {title}
        </span>
      </div>

      {/* Right: theme toggle */}
      <div className="flex-1 flex justify-end items-center">
        <ThemeToggle />
      </div>
    </header>
  );
}
