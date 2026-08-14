import { redirect } from "next/navigation";
import { getCurrentSession } from "./get-current-session";
import type { SessionPayload } from "./session";

/**
 * Use in Server Components / Server Actions where the user MUST be
 * authenticated. Redirects to /login (preserving the requested path via
 * ?next=) when no valid session is present.
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
