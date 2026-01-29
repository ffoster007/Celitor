"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type SubscriptionStatus = {
  active: boolean;
  subscription: {
    id: string;
    stripePriceId: string;
    status: string;
    currentPeriodEnd: string | null;
  } | null;
};

export default function PricingPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [startedCheckout, setStartedCheckout] = useState(false);

  const loadSubscription = useCallback(async () => {
    const res = await fetch("/api/stripe/subscription");
    if (!res.ok) {
      throw new Error("Failed to fetch subscription");
    }
    return (await res.json()) as SubscriptionStatus;
  }, []);

  const startCheckout = useCallback(async () => {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Failed to start checkout");
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/open/oauth");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (searchParams?.get("checkout") !== "success") return;
    const sessionId = searchParams?.get("session_id");

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      try {
        if (sessionId) {
          const syncRes = await fetch(
            `/api/stripe/checkout/sync?session_id=${encodeURIComponent(sessionId)}`
          );
          if (syncRes.ok) {
            const syncData = (await syncRes.json()) as { active?: boolean };
            if (syncData.active) {
              router.replace("/content");
              return;
            }
          }
        }
        const data = await loadSubscription();
        if (data.active) {
          router.replace("/content");
          return;
        }
      } catch {
        // ignore and retry
      }

      attempts += 1;
      if (!cancelled && attempts < 12) {
        setTimeout(poll, 2500);
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [status, searchParams, loadSubscription, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (searchParams?.get("checkout") === "success") return;
    if (startedCheckout) return;

    let cancelled = false;

    const run = async () => {
      try {
        const data = await loadSubscription();
        if (data.active) {
          router.replace("/content");
          return;
        }
        if (!cancelled) {
          setStartedCheckout(true);
          await startCheckout();
        }
      } catch {
        if (!cancelled) {
          setStartedCheckout(true);
          await startCheckout();
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [status, searchParams, startedCheckout, loadSubscription, startCheckout, router]);

  return null;
}
