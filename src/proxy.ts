import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { authSecret } from "@/lib/auth-config";

const SIGN_IN_PATH = "/open/oauth";
const DEFAULT_REDIRECT = "/content";

// กำหนดหน้าที่เป็น public (ไม่ต้อง auth)
const PUBLIC_ROUTES = [
  "/",
  "/landing",
  "/open/oauth",
  "/api/auth",
  // เพิ่มหน้า public อื่นๆ ตามต้องการ
];

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: authSecret,
  });

  const { pathname } = request.nextUrl;

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";

  const logUrl = new URL("/api/access-log", request.url);

  try {
    await fetch(logUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ipAddress,
        timeStamp: new Date().toISOString(),
      }),
      cache: "no-store",
    });
  } catch {
    // ignore log failures
  }
  
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  const isSignInRoute = pathname === SIGN_IN_PATH || pathname.startsWith(`${SIGN_IN_PATH}/`);

  // ถ้าไม่มี token และไม่ใช่ public route และไม่ใช่ sign in route
  if (!token && !isPublicRoute && !isSignInRoute) {
    const redirectUrl = new URL(SIGN_IN_PATH, request.url);
    const callback = request.nextUrl.pathname + request.nextUrl.search;
    if (callback && callback !== SIGN_IN_PATH) {
      redirectUrl.searchParams.set("callbackUrl", callback);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // ถ้ามี token แล้วยังอยู่ที่หน้า sign in
  if (token && isSignInRoute) {
    const callback = request.nextUrl.searchParams.get("callbackUrl");
    const target = callback && callback.startsWith("/") ? callback : DEFAULT_REDIRECT;
    const redirectUrl = new URL(target, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// ป้องกันทุกหน้า ยกเว้น static files และ API routes บางตัว
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).+)",
  ],
};