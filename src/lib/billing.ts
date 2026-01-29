import { prisma } from "@/lib/prisma";

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export async function getActiveSubscription(userId: string) {
  const now = new Date();

  return prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: Array.from(ACTIVE_STATUSES) },
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
