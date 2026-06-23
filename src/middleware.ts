import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REMOVED_PREFIXES = [
  "/dashboard/gbp",
  "/dashboard/rank-tracker",
  "/dashboard/ai-strategist",
  "/dashboard/competitors",
  "/dashboard/reviews",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    "/dashboard/gbp/:path*",
    "/dashboard/rank-tracker/:path*",
    "/dashboard/ai-strategist/:path*",
    "/dashboard/competitors/:path*",
    "/dashboard/reviews/:path*",
  ],
};
