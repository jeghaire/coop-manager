import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth-helpers";
import { stripe, APP_URL, billingEnabled } from "@/app/lib/stripe";
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
  const cooperative = await prisma.cooperative.findUnique({ where: { id: cooperativeId } });

  if (!cooperative?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found" }, { status: 404 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: cooperative.stripeCustomerId,
    return_url: `${APP_URL}/dashboard/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
