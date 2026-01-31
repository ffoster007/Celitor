import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getActiveSubscription } from "@/lib/billing";

export const runtime = "nodejs";

const toDate = (timestamp?: number | null) =>
  typeof timestamp === "number" ? new Date(timestamp * 1000) : null;

const getCustomerId = (customer: Stripe.Subscription["customer"] | Stripe.Checkout.Session["customer"]) =>
  typeof customer === "string" ? customer : customer?.id;

const upsertSubscription = async (
  subscription: Stripe.Subscription,
  userId: string
) => {
  const priceId = subscription.items.data[0]?.price?.id ?? "";

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId,
      stripeCustomerId: getCustomerId(subscription.customer) ?? "",
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: subscription.status,
      currentPeriodEnd: toDate(subscription.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      userId,
      stripeCustomerId: getCustomerId(subscription.customer) ?? "",
      stripePriceId: priceId,
      status: subscription.status,
      currentPeriodEnd: toDate(subscription.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (checkoutSession.mode !== "subscription" || !checkoutSession.subscription) {
      return NextResponse.json({ error: "Invalid checkout session" }, { status: 400 });
    }

    const metadataUserId = checkoutSession.metadata?.userId;
    if (metadataUserId && metadataUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const customerId = getCustomerId(checkoutSession.customer);
    if (!customerId) {
      return NextResponse.json({ error: "Missing customer" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, stripeCustomerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!metadataUserId && user.stripeCustomerId && user.stripeCustomerId !== customerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!user.stripeCustomerId || user.stripeCustomerId !== customerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const subscription =
      typeof checkoutSession.subscription === "string"
        ? await stripe.subscriptions.retrieve(checkoutSession.subscription)
        : (checkoutSession.subscription as Stripe.Subscription);

    await upsertSubscription(subscription, user.id);

    const activeSubscription = await getActiveSubscription(user.id);

    return NextResponse.json({
      active: Boolean(activeSubscription),
    });
  } catch (error) {
    console.error("Stripe checkout sync error:", error);
    return NextResponse.json({ error: "Failed to sync subscription" }, { status: 500 });
  }
}
