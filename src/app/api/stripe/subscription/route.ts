import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getActiveSubscription } from "@/lib/billing";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getActiveSubscription(session.user.id);

    return NextResponse.json({
      active: Boolean(subscription),
      subscription: subscription
        ? {
            id: subscription.id,
            stripePriceId: subscription.stripePriceId,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
    });
  } catch (error) {
    console.error("Stripe subscription status error:", error);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getActiveSubscription(session.user.id);

    if (!subscription) {
      return NextResponse.json({ error: "No active subscription" }, { status: 404 });
    }

    let stripeSubscription;
    try {
      stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );
    } catch (error) {
      const stripeError = error as { type?: string; message?: string };
      if (stripeError?.type === "StripeInvalidRequestError") {
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.stripeSubscriptionId },
          data: {
            status: "incomplete_expired",
            cancelAtPeriodEnd: true,
          },
        });
        return NextResponse.json({
          ok: true,
          status: "incomplete_expired",
          currentPeriodEnd: null,
          cancelAtPeriodEnd: true,
        });
      }
      throw error;
    }

    const cancellableStatuses = new Set(["active", "trialing"]);
    if (!cancellableStatuses.has(stripeSubscription.status)) {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: stripeSubscription.id },
        data: {
          status: stripeSubscription.status,
          currentPeriodEnd: stripeSubscription.current_period_end
            ? new Date(stripeSubscription.current_period_end * 1000)
            : null,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        },
      });
      return NextResponse.json({
        ok: true,
        status: stripeSubscription.status,
        currentPeriodEnd: stripeSubscription.current_period_end
          ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
          : null,
        cancelAtPeriodEnd: true,
      });
    }

    if (subscription.cancelAtPeriodEnd) {
      return NextResponse.json({
        ok: true,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
        cancelAtPeriodEnd: true,
      });
    }

    let updated;
    try {
      updated = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    } catch (error) {
      const stripeError = error as { type?: string; message?: string };
      if (stripeError?.type === "StripeInvalidRequestError") {
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.stripeSubscriptionId },
          data: { status: stripeSubscription.status, cancelAtPeriodEnd: true },
        });
        return NextResponse.json({
          ok: true,
          status: stripeSubscription.status,
          currentPeriodEnd: stripeSubscription.current_period_end
            ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
            : null,
          cancelAtPeriodEnd: true,
        });
      }
      throw error;
    }

    await prisma.subscription.update({
      where: { stripeSubscriptionId: updated.id },
      data: {
        status: updated.status,
        currentPeriodEnd: updated.current_period_end
          ? new Date(updated.current_period_end * 1000)
          : null,
        cancelAtPeriodEnd: updated.cancel_at_period_end,
      },
    });

    return NextResponse.json({
      ok: true,
      status: updated.status,
      currentPeriodEnd: updated.current_period_end
        ? new Date(updated.current_period_end * 1000).toISOString()
        : null,
      cancelAtPeriodEnd: updated.cancel_at_period_end,
    });
  } catch (error) {
    console.error("Stripe subscription cancel error:", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
