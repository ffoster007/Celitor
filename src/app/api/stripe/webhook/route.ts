import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Webhook secret - must be configured in production
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Stripe recommends responding within 20 seconds
export const maxDuration = 20;

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
  // Best Practice: Always verify webhook secret in production
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" }, 
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.warn("Webhook request missing Stripe signature");
    return NextResponse.json(
      { error: "Missing Stripe signature" }, 
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Best Practice: Use raw body for signature verification
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", errorMessage);
    return NextResponse.json(
      { error: "Invalid signature" }, 
      { status: 400 }
    );
  }

  // Log event for debugging (avoid logging sensitive data in production)
  console.log(`Processing Stripe webhook: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode !== "subscription" || !session.subscription) {
          console.log("Skipping non-subscription checkout session");
          break;
        }

        const subscriptionId = typeof session.subscription === "string" 
          ? session.subscription 
          : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = getCustomerId(subscription.customer);
        const userId = await resolveUserId(session.metadata?.userId, customerId);

        if (!userId) {
          console.warn(`Could not resolve userId for customer ${customerId}`);
          break;
        }

        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customerId },
        });

        await upsertSubscription(subscription, userId);
        console.log(`Subscription created for user ${userId}`);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = getCustomerId(subscription.customer);
        const userId = await resolveUserId(subscription.metadata?.userId, customerId);

        if (!userId) {
          console.warn(`Could not resolve userId for customer ${customerId}`);
          break;
        }

        await upsertSubscription(subscription, userId);
        console.log(`Subscription ${event.type} for user ${userId}`);
        break;
      }

      // Best Practice: Handle invoice payment failures
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" 
          ? invoice.customer 
          : invoice.customer?.id;
        
        if (customerId) {
          console.warn(`Payment failed for customer ${customerId}`);
          // Could notify user or update subscription status here
        }
        break;
      }

      default:
        // Log unhandled events for monitoring
        console.log(`Unhandled webhook event type: ${event.type}`);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Stripe webhook handler error:", errorMessage);
    // Best Practice: Return 500 so Stripe will retry
    return NextResponse.json(
      { error: "Webhook handler failed" }, 
      { status: 500 }
    );
  }
}
