export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/app/components/PageHeader";
import { getCurrencySymbol } from "@/app/lib/currency";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const user = session.user;
  const cooperativeId = user.cooperativeId as string;

  // Summary counts
  const [
    myActiveLoans,
    myPendingGuarantorRequests,
    verifiedContributions,
    cooperative,
  ] = await Promise.all([
    prisma.loanApplication.count({
      where: {
        userId: user.id,
        cooperativeId,
        status: { in: ["PENDING_GUARANTORS", "PENDING_ADMIN_REVIEW"] },
        deletedAt: null,
      },
    }),
    prisma.loanGuarantor.count({
      where: {
        guarantorId: user.id,
        status: "PENDING",
        deletedAt: null,
        loan: { status: "PENDING_GUARANTORS" },
      },
    }),
    prisma.contribution.findMany({
      where: {
        userId: user.id,
        cooperativeId,
        status: "VERIFIED",
        deletedAt: null,
      },
      select: { amount: true },
    }),
    prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { currency: true },
    }),
  ]);

  const verifiedTotal = verifiedContributions.reduce(
    (sum, c) => sum + Number(c.amount),
    0,
  );
  const sym = getCurrencySymbol(cooperative?.currency ?? "NGN");

  function roleBadge(role: string) {
    switch (role) {
      case "OWNER":
        return <Badge variant="success">{role}</Badge>;
      case "ADMIN":
        return <Badge variant="sky">{role}</Badge>;
      case "TREASURER":
        return <Badge variant="warning">{role}</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description={`Here's a summary of your activity and quick links to get you going`}
      />

      {/* Alerts */}
      {myPendingGuarantorRequests > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
            You have {myPendingGuarantorRequests} guarantor{" "}
            {myPendingGuarantorRequests === 1 ? "request" : "requests"} waiting
            for your response.
          </p>
          <Link
            href="/dashboard/loans"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Review
          </Link>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Contributed",
            value: `${sym}${verifiedTotal.toLocaleString()}`,
            href: "/dashboard/contributions",
            cta: "View history",
          },
          {
            label: "Active Loans",
            value: myActiveLoans,
            href: "/dashboard/loans",
            cta: "View loans",
          },
          {
            label: "Guarantor Requests",
            value: myPendingGuarantorRequests,
            href: "/dashboard/loans",
            cta: "Respond",
          },
        ].map((s) => (
          <Card
            key={s.label}
            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800/60 shadow-none"
          >
            <CardContent className="">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {s.label}
              </p>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {s.value}
              </p>
              <Link
                href={s.href}
                className={
                  buttonVariants({ size: "sm", variant: "ghost" }) +
                  " mt-3 -ml-2 text-emerald-600 dark:text-emerald-400"
                }
              >
                {s.cta} <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              href: "/dashboard/financial-summary",
              title: "Financial Summary",
              desc: "Your full financial position at a glance",
            },
            {
              href: "/dashboard/contributions/submit",
              title: "Submit Contribution",
              desc: "Record a payment for admin verification",
            },
            {
              href: "/dashboard/loans/apply",
              title: "Apply for a Loan",
              desc: "Submit an application with two guarantors",
            },
            {
              href: "/dashboard/loans",
              title: "My Loans",
              desc: "Track your applications and guarantor status",
            },
          ].map((action) => (
            <Link key={action.href} href={action.href} className="group block">
              <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800/60 shadow-none h-full transition-colors group-hover:border-emerald-300 dark:group-hover:border-emerald-500/30">
                <CardContent className="pt-5 pb-5">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                    {action.title} <ArrowRight className="size-3.5" />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {action.desc}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
