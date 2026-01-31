import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY is not set. " +
    "Please add it to your environment variables."
  );
}

// Best Practice: Validate API key format
if (!stripeSecretKey.startsWith("sk_")) {
  console.warn(
    "STRIPE_SECRET_KEY does not appear to be a valid Stripe secret key. " +
    "It should start with 'sk_test_' or 'sk_live_'."
  );
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-02-24.acacia",
  // Best Practice: Set app info for Stripe dashboard
  appInfo: {
    name: "Celitor",
    version: "0.1.0",
  },
  // Best Practice: Configure timeouts
  timeout: 30000, // 30 seconds
  maxNetworkRetries: 2,
});

// Helper type for subscription statuses
export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;
export type ActiveSubscriptionStatus = (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number];

// Helper type for cancellable statuses
export const CANCELLABLE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;
export type CancellableSubscriptionStatus = (typeof CANCELLABLE_SUBSCRIPTION_STATUSES)[number];

// Type guard for active subscriptions
export function isActiveStatus(status: string): status is ActiveSubscriptionStatus {
  return ACTIVE_SUBSCRIPTION_STATUSES.includes(status as ActiveSubscriptionStatus);
}
