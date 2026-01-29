import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const toDate = (timestamp?: number | null) =>
  typeof timestamp === "number" ? new Date(timestamp * 1000) : null;

const getCustomerId = (customer: Stripe.Subscription["customer"]) =>
  typeof customer === "string" ? customer : customer.id;

const resolveUserId = async (
  userId: string | null | undefined,
  customerId: string
) => {
  if (userId) return userId;
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return user?.id ?? null;
};

const upsertSubscription = async (
  subscription: Stripe.Subscription,
  userId: string
) => {
  const priceId = subscription.items.data[0]?.price?.id ?? "";

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId,
      stripeCustomerId: getCustomerId(subscription.customer),
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: subscription.status,
      currentPeriodEnd: toDate(subscription.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      userId,
      stripeCustomerId: getCustomerId(subscription.customer),
      stripePriceId: priceId,
      status: subscription.status,
      currentPeriodEnd: toDate(subscription.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
};

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature error:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode !== "subscription" || !session.subscription) {
          break;
        }

        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = getCustomerId(subscription.customer);
        const userId = await resolveUserId(session.metadata?.userId, customerId);

        if (!userId) break;

        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customerId },
        });

        await upsertSubscription(subscription, userId);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = getCustomerId(subscription.customer);
        const userId = await resolveUserId(subscription.metadata?.userId, customerId);

        if (!userId) break;

        await upsertSubscription(subscription, userId);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
