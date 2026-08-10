import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/saved", "/archive", "/crm", "/outreach", "/company-intel", "/analytics"];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isProtected = PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
  if (!isProtected) return NextResponse.next();

  const sessionCookie = request.cookies.get("xts_session");
  const userCookie = request.cookies.get("xts_user");

  if (!sessionCookie?.value && !userCookie?.value) {
    const authUrl = new URL("/auth", request.url);
    authUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.next();
}
