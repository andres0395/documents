import { DUMMY_HASH, verifyPassword } from "@/lib/auth/password";
import { userRepository } from "@/repositories/users";
import type { RoleName } from "@/types/user";

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: RoleName;
}

/**
 * Auth business logic. Owns the credential check and timing-safe
 * "user not found" handling. Returns a domain error (not a thrown
 * exception) for bad credentials so the Server Action can render a
 * user-friendly message.
 */
export const authService = {
  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<ServiceResult<AuthenticatedUser>> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
      // Run a bcrypt compare against a dummy hash so the wall-clock time
      // is similar to the real check. Defeats user-enumeration via timing.
      await verifyPassword(password, DUMMY_HASH);
      return { ok: false, error: "Credenciales inválidas" };
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return { ok: false, error: "Credenciales inválidas" };
    }

    return {
      ok: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role === "ADMIN" ? "admin" : "editor",
      },
    };
  },
};
