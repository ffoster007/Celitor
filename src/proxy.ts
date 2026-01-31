import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { authSecret } from "@/lib/auth-config";

const SIGN_IN_PATH = "/open/oauth";
const DEFAULT_REDIRECT = "/content";

// Security headers for all responses
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
} as const;

// Content Security Policy
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.stripe.com https://api.github.com wss:",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

// กำหนดหน้าที่เป็น public (ไม่ต้อง auth)
const PUBLIC_ROUTES = [
  "/",
  "/landing",
  "/open/oauth",
  "/api/auth",
  "/api/stripe/webhook", // Stripe webhook ต้อง public
  // เพิ่มหน้า public อื่นๆ ตามต้องการ
];

// Check for suspicious requests (security scanners, bots)
function isSuspiciousRequest(userAgent: string): boolean {
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /havij/i,
    /nessus/i,
    /\bcurl\b.*\bbot\b/i,
  ];
  return suspiciousPatterns.some((pattern) => pattern.test(userAgent));
}

// Add security headers to response
function addSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  
  // Add CSP and HSTS in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Content-Security-Policy", CSP_HEADER);
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
  
  return response;
}

export async function proxy(request: NextRequest) {
  // Block suspicious requests
  const userAgent = request.headers.get("user-agent") || "";
  if (isSuspiciousRequest(userAgent)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

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

  // Add security headers to all responses
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

// ป้องกันทุกหน้า ยกเว้น static files และ API routes บางตัว
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).+)",
  ],
};