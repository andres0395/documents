import { redirect } from "next/navigation";
import { getCurrentSession } from "./get-current-session";
import type { SessionPayload } from "./session";
import type { RoleName } from "@/types/user";

/**
 * Use in Server Components / Server Actions where the user MUST be
 * authenticated. Redirects to /login (preserving the requested path
 * via ?next=) when no valid session is present.
 */
export async function requireSession(
  currentPath?: string,
): Promise<SessionPayload> {
  const session = await getCurrentSession();
  if (!session) {
    const params = currentPath ? `?next=${encodeURIComponent(currentPath)}` : "";
    redirect(`/login${params}`);
  }
  return session;
}

/**
 * "NestJS-guard" style helper: requires an authenticated session whose
 * role matches the one passed in. Redirects to /dashboard when the
 * user is authenticated but lacks the required role.
 *
 *   const session = await requireRole("admin");
 *
 * Throws via `redirect()` — in a Server Action, Next.js catches the
 * NEXT_REDIRECT and navigates; in a Server Component it short-circuits
 * the render.
 */
export async function requireRole(
  role: RoleName,
  currentPath?: string,
): Promise<SessionPayload> {
  const session = await requireSession(currentPath);
  if (session.role !== role) {
    redirect("/dashboard");
  }
  return session;
}
