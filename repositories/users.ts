import type { Prisma, Role, User } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  list(): Promise<User[]>;
  listPaginated(
    skip: number,
    take: number,
    filters?: { nombre?: string; email?: string; role?: Role },
  ): Promise<{ data: User[]; total: number }>;
  count(): Promise<number>;
  countByRole(role: Role): Promise<number>;
  create(input: Prisma.UserCreateInput): Promise<User>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
  delete(id: string): Promise<void>;
}

function buildWhere(
  filters?: { nombre?: string; email?: string; role?: Role },
): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};
  if (filters?.nombre) {
    where.name = { contains: filters.nombre, mode: "insensitive" };
  }
  if (filters?.email) {
    where.email = { contains: filters.email, mode: "insensitive" };
  }
  if (filters?.role) {
    where.role = filters.role;
  }
  return where;
}

class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async list(): Promise<User[]> {
    return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  }

  async listPaginated(
    skip: number,
    take: number,
    filters?: { nombre?: string; email?: string; role?: Role },
  ): Promise<{ data: User[]; total: number }> {
    const where = buildWhere(filters);
    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);
    return { data, total };
  }

  async count(): Promise<number> {
    return prisma.user.count();
  }

  async countByRole(role: Role): Promise<number> {
    return prisma.user.count({ where: { role } });
  }

  async create(input: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data: input });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }
}

export const userRepository: IUserRepository = new UserRepository();
