/**
 * Security headers and rate limiting utilities
 * Best Practice: Centralized security configuration
 */

import { NextResponse } from "next/server";

// Rate limiting store (in-memory, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Default rate limit configs for different endpoints
export const RATE_LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 requests per 15 min
  api: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  stripe: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 requests per minute
} as const;

/**
 * Simple rate limiter
 * Note: For production, use Redis or similar distributed store
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // Create new window
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetTime: entry.resetTime };
}

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "unknown";
}

/**
 * Create rate limit exceeded response
 */
export function rateLimitExceededResponse(resetTime: number): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  return new NextResponse(
    JSON.stringify({ 
      error: "Too many requests",
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
      },
    }
  );
}

/**
 * Security headers for API responses
 * Best Practice: Add security headers to all responses
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  
  // Enable XSS filter (legacy browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");
  
  // Strict referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Prevent caching of sensitive data
  response.headers.set("Cache-Control", "no-store, max-age=0");
  
  return response;
}

/**
 * Content Security Policy for the application
 */
export const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.stripe.com https://api.github.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

/**
 * Validate origin for CORS
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    "http://localhost:3000",
  ].filter(Boolean);
  
  return allowedOrigins.includes(origin);
}
