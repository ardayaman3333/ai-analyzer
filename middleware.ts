import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
const COOKIE_NAME = "nexus_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const existing = request.cookies.get(COOKIE_NAME)?.value;
  if (!existing) {
    response.cookies.set(COOKIE_NAME, crypto.randomUUID(), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: MAX_AGE,
    });
  }
  return response;
}

export const config = {
  matcher: "/:path*",
};
