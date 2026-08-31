import type { Role, User as PrismaUser } from "@/lib/generated/prisma/client";

/**
 * Domain User shape — mirrors the Prisma model. Consumers that must
 * never see the password hash should reach for `UserPublic` below.
 */
export type User = PrismaUser;

/**
 * Wire-shape for the browser. Never include `passwordHash` here.
 */
export interface UserPublic {
  id: string;
  email: string;
  name: string | null;
  role: RoleName;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lower-case role string used everywhere outside Prisma (forms,
 * Server Action payloads, JWT claims, etc.). Conversion to Prisma's
 * uppercase enum happens at the repository boundary.
 */
export type RoleName = "admin" | "editor";

export const ROLES: ReadonlyArray<{ value: RoleName; label: string }> = [
  { value: "admin", label: "Administrador" },
  { value: "editor", label: "Editor" },
];

export function isRoleName(value: unknown): value is RoleName {
  return value === "admin" || value === "editor";
}

export function prismaRoleToName(role: Role): RoleName {
  return role === "ADMIN" ? "admin" : "editor";
}

export function nameToPrismaRole(role: RoleName): Role {
  return role === "admin" ? "ADMIN" : "EDITOR";
}

export function toUserPublic(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: prismaRoleToName(user.role),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
