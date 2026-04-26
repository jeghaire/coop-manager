import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth-helpers";
import { stripe, STRIPE_PRICE_ID, APP_URL, billingEnabled } from "@/app/lib/stripe";
import prisma from "@/app/lib/prisma";

export async function POST(request: NextRequest) {
  if (!billingEnabled()) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (role !== "OWNER") {
    return NextResponse.json({ error: "Only the owner can manage billing" }, { status: 403 });
  }

  const cooperativeId = session.user.cooperativeId as string;
  const cooperative = await prisma.cooperative.findUnique({
    where: { id: cooperativeId },
  });

  if (!cooperative) {
    return NextResponse.json({ error: "Cooperative not found" }, { status: 404 });
  }

  // Create or reuse Stripe customer
  let customerId = cooperative.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: cooperative.name,
      metadata: { cooperativeId },
    });
    customerId = customer.id;
    await prisma.cooperative.update({
      where: { id: cooperativeId },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${APP_URL}/dashboard/billing?success=1`,
    cancel_url: `${APP_URL}/dashboard/billing?canceled=1`,
    metadata: { cooperativeId },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
