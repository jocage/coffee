import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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

export function proxy(request: NextRequest) {
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

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
