import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // Extract subdomain (supports both production domains and *.localhost).
  const normalizedHost = hostname.toLowerCase();
  const parts = normalizedHost.split(".");
  let subdomain = "";

  if (normalizedHost.endsWith(".localhost")) {
    subdomain = normalizedHost.replace(/\.localhost$/, "").split(".")[0] || "";
  } else if (parts.length > 2 && parts[0] !== "www") {
    subdomain = parts[0];
  }

  // Route based on subdomain presence
  // For tenant subdomains, only redirect root to /login.
  // Keep /admin and /dashboard accessible so page-level auth can handle access.
  if (subdomain && pathname === "/") {
    return NextResponse.redirect(new URL(`/login`, request.nextUrl));
  }

  // If there is no subdomain and host is not local, always keep users on landing page.
  const isLocalHost =
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost === "[::1]";

  if (!subdomain && !isLocalHost && pathname !== "/") {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};

