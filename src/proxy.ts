import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { isDemoMode } from "@/lib/demo";
import { isPublicPath } from "@/lib/public-paths";

const authProxy = auth((request) => {
  if (request.auth?.user?.email) return NextResponse.next();
  const login = new URL("/login", request.nextUrl.origin);
  login.searchParams.set("callbackUrl", request.nextUrl.href);
  return NextResponse.redirect(login);
});

export function proxy(...args: Parameters<typeof authProxy>) {
  const request = args[0] as NextRequest;
  // Public pages and demo mode skip the session lookup entirely.
  // Demo mode never runs in production.
  if (isPublicPath(request.nextUrl.pathname) || isDemoMode()) return NextResponse.next();
  return authProxy(...args);
}

export const config = {
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|opengraph-image).*)",
  ],
};
