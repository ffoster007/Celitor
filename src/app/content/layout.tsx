import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasActiveSubscription } from "@/lib/billing";

export default async function ContentLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/open/oauth");
  }

  const active = await hasActiveSubscription(session.user.id);
  if (!active) {
    redirect("/pricing");
  }

  return <>{children}</>;
}
