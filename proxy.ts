/**
 * Next.js 16 Proxy (formerly `middleware.ts`).
 *
 * Responsibilities:
 *   1. Allow public routes (`/login`) through.
 *   2. Verify the session JWT on every other request.
 *   3. Redirect unauthenticated requests to `/login?next=<original>`.
 *   4. Drop invalid/expired cookies on the redirect response.
 *   5. For admin-only paths (`/admin/*`), reject non-admin sessions
 *      at the edge — fail fast before the Server Component renders.
 *   6. Attach userId, email, and role to request headers so downstream
 *      Server Components / Actions can read them (they still verify
 *      for safety; the header is a hint).
 *
 * Runs on the Edge runtime. We use `jose` (Edge-safe) for the JWT
 * verify and stay away from Prisma here — DB calls would slow the
 * proxy and break the "Edge-deployed to the CDN" guarantee Next.js
 * gives to this file.
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/config";
import { verifySessionToken } from "@/lib/auth/session";

const PUBLIC_PATHS: ReadonlySet<string> = new Set(["/login"]);

// Paths that require an admin session.
const ADMIN_PATH_REGEX = /^\/admin(\/|$)/;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATH_REGEX.test(pathname);
}

function redirectToLogin(request: NextRequest, clearCookie: boolean) {
  const loginUrl = new URL("/login", request.url);
  // Preserve only the path + query so we never bounce users to an
  // external host. The login Server Action re-validates this with Zod.
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  const response = NextResponse.redirect(loginUrl);
  if (clearCookie) {
    response.cookies.delete(SESSION_COOKIE_NAME);
  }
  return response;
}

function redirectToDashboard(request: NextRequest) {
  // Non-admin trying to reach an admin-only route. Send them to the
  // role-aware router; it'll land editors on /citas.
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return redirectToLogin(request, false);
  }

  return verifySessionToken(token).then((session) => {
    if (!session) {
      return redirectToLogin(request, true);
    }

    // Edge-level admin gate. Server Components re-check via
    // requireRole() as defense in depth.
    if (isAdminPath(pathname) && session.role !== "admin") {
      return redirectToDashboard(request);
    }

    const response = NextResponse.next();
    response.headers.set("x-user-id", session.userId);
    response.headers.set("x-user-email", session.email);
    response.headers.set("x-user-role", session.role);
    return response;
  });
}

/**
 * Run on every path except:
 *   - /api/* (route handlers handle their own auth, e.g. the
 *     /api/cron/daily-reminders route uses a Bearer token, not a
 *     session cookie; if the proxy ran there, it would 307-redirect
 *     the cron to /login)
 *   - _next/static, _next/image (Next internals)
 *   - favicon.ico
 *   - common static assets (images, fonts)
 *
 * `/login` is NOT excluded here because we still want to read the
 * cookie (to detect "already logged in" and let the page redirect
 * to /dashboard). The public-path check inside `proxy` handles the
 * rest.
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|otf)$).*)",
  ],
};
