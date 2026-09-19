import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { applySecurityHeaders } from "@/lib/security/headers";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract client IP with reliable header fallbacks
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";

  // Check if test bypass is present
  const isTest =
    process.env.NODE_ENV === "test" ||
    request.headers.get("x-test-env") === "true";

  // API Rate Limiting Defense
  if (pathname.startsWith("/api/") && !isTest) {
    let limit = 120; // Default general API limit
    let windowMs = 60 * 1000;
    let rateKey = `ip:${ip}:general`;

    if (pathname.startsWith("/api/v1/auth/login")) {
      limit = 12; // 12 attempts per minute for brute-force prevention
      rateKey = `ip:${ip}:auth`;
    } else if (
      pathname.startsWith("/api/v1/simulation") ||
      (pathname.startsWith("/api/v1/models/custom") && request.method === "POST")
    ) {
      limit = 40; // 40 scenario computations per minute
      rateKey = `ip:${ip}:compute`;
    }

    const rateResult = checkRateLimit(rateKey, limit, windowMs);

    if (!rateResult.allowed) {
      const retryAfterSec = Math.ceil(rateResult.resetMs / 1000);
      const res = NextResponse.json(
        {
          error: "Rate limit exceeded. Hydro-telemetry access throttled.",
          retryAfterSeconds: retryAfterSec,
          status: 429,
        },
        { status: 429 }
      );

      res.headers.set("Retry-After", String(retryAfterSec));
      res.headers.set("X-RateLimit-Limit", String(rateResult.limit));
      res.headers.set("X-RateLimit-Remaining", "0");
      res.headers.set("X-RateLimit-Reset", String(retryAfterSec));
      applySecurityHeaders(res.headers);
      return res;
    }

    // Proceed and attach rate limit headers
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(rateResult.limit));
    response.headers.set("X-RateLimit-Remaining", String(rateResult.remaining));
    applySecurityHeaders(response.headers);
    return response;
  }

  // Non-API or general routes: apply security headers
  const response = NextResponse.next();
  applySecurityHeaders(response.headers);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, public assets
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
