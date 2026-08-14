/**
 * Auth configuration: cookie name, session lifetime, and the secret used
 * to sign session JWTs.
 *
 * The secret is loaded lazily so we can throw a clear, actionable error
 * when AUTH_SECRET is missing — instead of failing later inside `jose`.
 */

export const SESSION_COOKIE_NAME = "citas.session";
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Minimum length (in chars) for AUTH_SECRET. 32 chars ≈ 192 bits of
 * entropy when base64-encoded, which is enough for HS256.
 */
const MIN_SECRET_LENGTH = 32;

let _secretBytes: Uint8Array | null = null;

function readSecret(): Uint8Array {
  if (_secretBytes) return _secretBytes;
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Generate one with: " +
        "`openssl rand -base64 48` and put it in your .env",
    );
  }
  _secretBytes = new TextEncoder().encode(secret);
  return _secretBytes;
}

export function getAuthSecret(): Uint8Array {
  return readSecret();
}
