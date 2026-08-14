import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "./config";
import { verifySessionToken, type SessionPayload } from "./session";

/**
 * Read the current session in a Server Component / Server Action.
 * Returns `null` when the cookie is missing or the JWT is invalid /
 * expired.
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
