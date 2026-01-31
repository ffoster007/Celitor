import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Validate IP address format (IPv4 or IPv6)
const IP_REGEX = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$|^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$|^::1$|^unknown$/;

function sanitizeIp(ip: string): string {
  const trimmed = ip.trim().substring(0, 45); // Max IPv6 length
  return IP_REGEX.test(trimmed) ? trimmed : "unknown";
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication to prevent abuse
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const headerIp = request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();
    const rawIp =
      (typeof body.ipAddress === "string" && body.ipAddress.trim()) ||
      headerIp ||
      request.headers.get("x-real-ip") ||
      "unknown";
    
    const ipAddress = sanitizeIp(rawIp);

    let timeStamp = new Date();
    if (typeof body.timeStamp === "string") {
      const parsed = new Date(body.timeStamp);
      // Validate timestamp is not too far in future or past (24 hours)
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      if (!Number.isNaN(parsed.getTime()) && 
          parsed.getTime() >= now - dayMs && 
          parsed.getTime() <= now + dayMs) {
        timeStamp = parsed;
      }
    }

    await prisma.accessLog.create({
      data: {
        ipAddress,
        timeStamp,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
