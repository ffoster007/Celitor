import { prisma } from "@/lib/prisma";
import { ACTIVE_SUBSCRIPTION_STATUSES } from "@/lib/stripe";

export async function getActiveSubscription(userId: string) {
  const now = new Date();

  return prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: [...ACTIVE_SUBSCRIPTION_STATUSES] },
      OR: [
        { currentPeriodEnd: null },
        { currentPeriodEnd: { gt: now } },
      ],
    },
    orderBy: { currentPeriodEnd: "desc" },
  });
}

export async function hasActiveSubscription(userId: string) {
  const subscription = await getActiveSubscription(userId);
  return Boolean(subscription);
}
