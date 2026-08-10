import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const userCookie = request.cookies.get("xts_user");
  const pathname = request.nextUrl.pathname;

  const protectedRoutes = ["/saved", "/archive", "/outreach", "/company-intel"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !userCookie?.value) {
    const authUrl = new URL("/auth", request.url);
    authUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/saved/:path*", "/archive/:path*", "/outreach/:path*", "/company-intel/:path*"],
};
