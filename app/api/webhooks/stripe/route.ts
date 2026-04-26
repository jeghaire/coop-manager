import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/app/lib/stripe";
import prisma from "@/app/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const cooperativeStatusMap: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED"> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "PAST_DUE",
    trialing: "ACTIVE",
  };

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as any;
      const customerId = sub.customer as string;
      const status = cooperativeStatusMap[sub.status] ?? "PAST_DUE";
      const billingCycleEnd = new Date(sub.current_period_end * 1000);

      await prisma.cooperative.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          stripeSubscriptionId: sub.id,
          subscriptionStatus: status,
          billingCycleEnd,
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as any;
      await prisma.cooperative.updateMany({
        where: { stripeCustomerId: sub.customer as string },
        data: { subscriptionStatus: "CANCELED", billingCycleEnd: null },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      await prisma.cooperative.updateMany({
        where: { stripeCustomerId: invoice.customer as string },
        data: { subscriptionStatus: "PAST_DUE" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
