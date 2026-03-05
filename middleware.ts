import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // Extract subdomain
  const parts = hostname.split(".");
  let subdomain = "";

  if (parts.length > 2 || (parts.length === 2 && parts[0] !== "www")) {
    subdomain = parts[0];
  }

  // Route based on subdomain presence
  // If subdomain exists, always redirect to /login with tenant context
  if (subdomain && subdomain !== "www" && pathname !== "/login") {
    // Subdomain requests without /login path get redirected to /login
    return NextResponse.redirect(new URL(`/login`, request.nextUrl));
  }

  // If no subdomain and path is /login, redirect to landing
  if (!subdomain && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  // Store subdomain in headers for route handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-subdomain", subdomain);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};

