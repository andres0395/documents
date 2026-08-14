import type { User as PrismaUser } from "@/lib/generated/prisma/client";

/**
 * Domain User shape — mirrors the Prisma model. The `passwordHash` field
 * is intentionally NOT excluded here at the type level; consumers that
 * must not see it should reach for the wire-shape `UserPublic` below.
 */
export type User = PrismaUser;

/**
 * Wire-shape for the browser. Never include `passwordHash` here.
 */
export interface UserPublic {
  id: string;
  email: string;
  name: string | null;
}

export function toUserPublic(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
