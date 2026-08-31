import { hashPassword } from "@/lib/auth/password";
import { userRepository } from "@/repositories/users";
import type { User } from "@/types/user";
import {
  nameToPrismaRole,
  prismaRoleToName,
  type RoleName,
} from "@/types/user";

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface UserListFilters {
  nombre?: string;
  email?: string;
  role?: RoleName;
}

export interface CreateUserPayload {
  email: string;
  name?: string;
  role: RoleName;
  password: string;
}

export interface UpdateUserPayload {
  id: string;
  email: string;
  name?: string;
  role: RoleName;
  /** Optional — if absent or empty, the password is left unchanged. */
  password?: string;
}

const EMAIL_IN_USE_ERROR = "Ya existe un usuario con ese email";
const SELF_DELETE_ERROR = "No podés eliminar tu propio usuario";
const LAST_ADMIN_ERROR =
  "No se puede eliminar al último administrador del sistema";

/**
 * User-management business logic.
 *
 * Enforces:
 *   - Email uniqueness
 *   - An admin cannot delete themselves
 *   - The system must always retain at least one ADMIN
 */
export const userService = {
  async list(): Promise<User[]> {
    return userRepository.list();
  },

  async listPaginated(
    filters: UserListFilters,
    offset: number,
    limit: number,
  ): Promise<{ data: User[]; total: number }> {
    return userRepository.listPaginated(offset, limit, {
      nombre: filters.nombre,
      email: filters.email,
      role: filters.role ? nameToPrismaRole(filters.role) : undefined,
    });
  },

  async findById(id: string): Promise<User | null> {
    return userRepository.findById(id);
  },

  async create(payload: CreateUserPayload): Promise<ServiceResult<User>> {
    if (!payload.email.trim()) {
      return { ok: false, error: "El email es obligatorio" };
    }
    if (!payload.password || payload.password.length < 8) {
      return { ok: false, error: "La contraseña debe tener al menos 8 caracteres" };
    }
    if (!payload.role) {
      return { ok: false, error: "El rol es obligatorio" };
    }

    const existing = await userRepository.findByEmail(payload.email.toLowerCase().trim());
    if (existing) {
      return { ok: false, error: EMAIL_IN_USE_ERROR };
    }

    const passwordHash = await hashPassword(payload.password);
    const user = await userRepository.create({
      email: payload.email.toLowerCase().trim(),
      name: payload.name?.trim() || null,
      passwordHash,
      role: nameToPrismaRole(payload.role),
    });
    return { ok: true, data: user };
  },

  async update(payload: UpdateUserPayload): Promise<ServiceResult<User>> {
    const existing = await userRepository.findById(payload.id);
    if (!existing) {
      return { ok: false, error: "El usuario no existe" };
    }

    const normalizedEmail = payload.email.toLowerCase().trim();
    if (!normalizedEmail) {
      return { ok: false, error: "El email es obligatorio" };
    }
    if (normalizedEmail !== existing.email) {
      const dupe = await userRepository.findByEmail(normalizedEmail);
      if (dupe && dupe.id !== existing.id) {
        return { ok: false, error: EMAIL_IN_USE_ERROR };
      }
    }

    // If the role is being demoted, ensure at least one admin remains.
    const previousRole = prismaRoleToName(existing.role);
    if (previousRole === "admin" && payload.role === "editor") {
      const adminCount = await userRepository.countByRole("ADMIN");
      if (adminCount <= 1) {
        return { ok: false, error: "Debe quedar al menos un administrador" };
      }
    }

    const data: Parameters<typeof userRepository.update>[1] = {
      email: normalizedEmail,
      name: payload.name?.trim() || null,
      role: nameToPrismaRole(payload.role),
    };
    if (payload.password && payload.password.length > 0) {
      data.passwordHash = await hashPassword(payload.password);
    }

    const updated = await userRepository.update(payload.id, data);
    return { ok: true, data: updated };
  },

  async delete(id: string, currentUserId: string): Promise<ServiceResult<true>> {
    if (id === currentUserId) {
      return { ok: false, error: SELF_DELETE_ERROR };
    }
    const target = await userRepository.findById(id);
    if (!target) {
      return { ok: false, error: "El usuario no existe" };
    }
    // If deleting an admin, make sure at least one admin remains.
    if (target.role === "ADMIN") {
      const adminCount = await userRepository.countByRole("ADMIN");
      if (adminCount <= 1) {
        return { ok: false, error: LAST_ADMIN_ERROR };
      }
    }
    await userRepository.delete(id);
    return { ok: true, data: true };
  },
};
