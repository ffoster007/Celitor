"use client";

import { SessionProvider } from "next-auth/react";
import { InteractionGuard } from "@/components/security/interaction-guard";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <InteractionGuard />
      {children}
    </SessionProvider>
  );
}
