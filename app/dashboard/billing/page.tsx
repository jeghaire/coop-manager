export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { billingEnabled } from "@/app/lib/stripe";
import { BillingActions } from "./BillingActions";
import { Badge } from "@/components/ui/badge";

const STATUS_BADGE = {
  ACTIVE: "success",
  PAST_DUE: "warning",
  CANCELED: "destructive",
} as const;

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const role = session.user.role as string;
  if (role !== "OWNER") redirect("/dashboard");

  const cooperativeId = session.user.cooperativeId as string;
  const cooperative = await prisma.cooperative.findUnique({
    where: { id: cooperativeId },
    select: {
      name: true,
      subscriptionStatus: true,
      billingCycleEnd: true,
      stripeSubscriptionId: true,
    },
  });

  const { success, canceled } = await searchParams;
  const enabled = billingEnabled();

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Billing
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Manage your cooperative&apos;s subscription
        </p>
      </div>

      {success === "1" && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-700 dark:text-emerald-300">
          Subscription activated. Thank you!
        </div>
      )}
      {canceled === "1" && (
        <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-sm text-zinc-600 dark:text-zinc-400">
          Checkout cancelled. No changes were made.
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {cooperative?.name}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              £500 / year
            </p>
          </div>
          <Badge
            variant={
              STATUS_BADGE[cooperative?.subscriptionStatus ?? "CANCELED"] ??
              "secondary"
            }
          >
            {cooperative?.subscriptionStatus ?? "INACTIVE"}
          </Badge>
        </div>

        {cooperative?.billingCycleEnd && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {cooperative.subscriptionStatus === "ACTIVE"
              ? "Renews"
              : "Expires"}{" "}
            {new Date(cooperative.billingCycleEnd).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}

        {!enabled && (
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2">
            Stripe is not configured. Set <code className="font-mono">STRIPE_SECRET_KEY</code> and <code className="font-mono">STRIPE_PRICE_ID</code> to enable billing.
          </p>
        )}

        <BillingActions
          status={cooperative?.subscriptionStatus ?? "CANCELED"}
          hasSubscription={Boolean(cooperative?.stripeSubscriptionId)}
          billingEnabled={enabled}
        />
      </div>
    </div>
  );
}
