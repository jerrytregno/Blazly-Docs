import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REMOVED_PREFIXES = [
  "/dashboard/gbp",
  "/dashboard/ai-strategist",
  "/dashboard/competitors",
  "/dashboard/reviews",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/dashboard/keyword-research" ||
    pathname.startsWith("/dashboard/keyword-research/")
  ) {
    return NextResponse.redirect(new URL("/dashboard/rank-tracker", request.url));
  }

  if (
    pathname.startsWith("/dashboard/rank-tracker/") &&
    pathname !== "/dashboard/rank-tracker"
  ) {
    return NextResponse.redirect(new URL("/dashboard/rank-tracker", request.url));
  }

  if (
    REMOVED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/keyword-research",
    "/dashboard/keyword-research/:path*",
    "/dashboard/rank-tracker/:path*",
    "/dashboard/gbp/:path*",
    "/dashboard/ai-strategist/:path*",
    "/dashboard/competitors/:path*",
    "/dashboard/reviews/:path*",
  ],
};
