import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const headerIp = request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();
    const ipAddress =
      (typeof body.ipAddress === "string" && body.ipAddress.trim()) ||
      headerIp ||
      request.headers.get("x-real-ip") ||
      "unknown";

    let timeStamp = new Date();
    if (typeof body.timeStamp === "string") {
      const parsed = new Date(body.timeStamp);
      if (!Number.isNaN(parsed.getTime())) {
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
