import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // Extract subdomain
  const parts = hostname.split(".");
  let subdomain = "";

  if (parts.length > 2 || (parts.length === 2 && parts[0] !== "www")) {
    subdomain = parts[0];
  }

  // Store subdomain in headers for route handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-subdomain", subdomain);

  // Allow login page and API routes without authentication
  if (pathname === "/login" || pathname.startsWith("/api/")) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const token = await getToken({ req: request });

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
