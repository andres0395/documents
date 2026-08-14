/**
 * Next.js 16 Proxy (formerly `middleware.ts`).
 *
 * Responsibilities:
 *   1. Allow public routes (`/login` and Next's static assets) through.
 *   2. Verify the session JWT on every other request.
 *   3. Redirect unauthenticated requests to `/login?next=<original>` so
 *      the user lands back where they were after signing in.
 *   4. Drop invalid/expired cookies on the redirect response so the
 *      client doesn't keep sending them.
 *   5. Attach the resolved userId to a request header so downstream
 *      Server Components / Actions can read it without re-verifying
 *      the JWT (they still verify for safety — the header is a hint).
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

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return redirectToLogin(request, false);
  }

  // Synchronous shape is fine here — verifySessionToken returns a Promise
  // but the function itself doesn't need to be async. The framework
  // awaits whatever we return.
  return verifySessionToken(token).then((session) => {
    if (!session) {
      return redirectToLogin(request, true);
    }
    const response = NextResponse.next();
    response.headers.set("x-user-id", session.userId);
    response.headers.set("x-user-email", session.email);
    return response;
  });
}

/**
 * Run on every path except:
 *   - _next/static, _next/image (Next internals)
 *   - favicon.ico
 *   - common static assets (images, fonts)
 *
 * `/login` is NOT excluded here because we still want to read the
 * cookie (to detect "already logged in" and let the page redirect
 * to /citas). The public-path check inside `proxy` handles the rest.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|otf)$).*)",
  ],
};
