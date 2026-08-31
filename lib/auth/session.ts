/**
 * Session JWT: HS256-signed via `jose`. Edge-runtime safe.
 *
 * Token shape:
 *   {
 *     sub: <userId>,
 *     email: <user email>,
 *     role: <"admin" | "editor">,
 *     iat: <issued at, seconds>,
 *     exp: <expires at, seconds>,
 *   }
 */

import { jwtVerify, SignJWT } from "jose";
import { getAuthSecret, SESSION_DURATION_SECONDS } from "./config";
import { isRoleName, type RoleName } from "@/types/user";

export interface SessionPayload {
  userId: string;
  email: string;
  role: RoleName;
}

const ALG = "HS256";

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getAuthSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), {
      algorithms: [ALG],
    });
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      !isRoleName(payload.role)
    ) {
      return null;
    }
    return { userId: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}
