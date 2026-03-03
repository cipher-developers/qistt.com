import { withAuth } from "next-auth/middleware";
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

  // For other pages, check authentication
  return withAuth(
    (req) => {
      const token = req.nextauth?.token;
      
      if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    },
    {
      callbacks: {
        authorized: ({ token }) => !!token,
      },
      pages: {
        signIn: "/login",
      },
    }
  )(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
