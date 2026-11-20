import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDemoMode } from "@/lib/demo";

const authProxy = auth((request) => {
  if (request.auth?.user?.email) return NextResponse.next();
  const login = new URL("/login", request.nextUrl.origin);
  login.searchParams.set("callbackUrl", request.nextUrl.href);
  return NextResponse.redirect(login);
});

export function proxy(...args: Parameters<typeof authProxy>) {
  // Demo mode skips the session lookup entirely; it never runs in production.
  if (isDemoMode()) return NextResponse.next();
  return authProxy(...args);
}

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
};
