import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
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

  // Allow login page without authentication
  if (pathname === "/login" || pathname.startsWith("/api/")) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // For other pages, check authentication using auth()
  const session = await auth();
  
  if (!session?.user) {
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
