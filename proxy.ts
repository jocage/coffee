import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const protectedPrefixes = [
  "/home",
  "/recipes",
  "/brews",
  "/coffees",
  "/gear",
  "/profile",
  "/settings",
  "/export-studio",
  "/brew",
  "/community",
  "/clubs",
  "/challenges",
  "/messages",
  "/notifications"
];

const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const rateLimitBuckets = new Map<string, RateLimitBucket>();

export function proxy(request: NextRequest) {
  const limited = applyRateLimit(request);

  if (limited) {
    return limited;
  }

  const isPublicGearProfile = /^\/gear\/[^/]+$/.test(request.nextUrl.pathname);
  const isProtected = !isPublicGearProfile && protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (!isProtected || process.env.E2E_AUTH_BYPASS === "true") {
    return NextResponse.next();
  }

  const hasSessionCookie = request.cookies.get("better-auth.session_token") || request.cookies.get("__Secure-better-auth.session_token");

  if (!hasSessionCookie) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

function applyRateLimit(request: NextRequest) {
  if (
    process.env.E2E_AUTH_BYPASS === "true" ||
    process.env.APP_RATE_LIMIT_ENABLED === "false" ||
    !mutatingMethods.has(request.method)
  ) {
    return null;
  }

  const now = Date.now();
  const windowMs = parsePositiveInteger(process.env.APP_RATE_LIMIT_WINDOW_SECONDS, 60) * 1000;
  const max = parsePositiveInteger(process.env.APP_RATE_LIMIT_MAX, 120);
  const ip = clientIp(request);
  const key = `${ip}:${request.nextUrl.pathname}`;
  const existing = rateLimitBuckets.get(key);

  for (const [bucketKey, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) {
      rateLimitBuckets.delete(bucketKey);
    }
  }

  if (!existing || existing.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  existing.count += 1;

  if (existing.count <= max) {
    return null;
  }

  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: {
        "retry-after": String(Math.ceil((existing.resetAt - now) / 1000)),
        "x-ratelimit-limit": String(max),
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": String(Math.ceil(existing.resetAt / 1000))
      }
    }
  );
}

function clientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  return forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  matcher: ["/api/media/:path*", "/((?!api/auth|_next/static|_next/image|favicon.ico).*)"]
};
