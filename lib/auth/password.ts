/**
 * Password hashing using bcrypt. Pure-JS implementation so it works
 * in the Node.js server runtime.
 *
 * 12 rounds ≈ 250ms on a typical 2024 CPU — strong enough for an app
 * like this without killing login latency.
 */

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    // Malformed hash shouldn't crash the login flow; treat as failed match.
    return false;
  }
}

/**
 * Valid bcrypt hash used to make the "user not found" branch take the
 * same wall-clock time as the "wrong password" branch. Prevents a
 * timing oracle that would let an attacker enumerate valid emails.
 */
export const DUMMY_HASH =
  "$2b$12$0000000000000000000000000000000000000000000000000000";
