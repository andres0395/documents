import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { Cita, CreateCitaInput, UpdateCitaInput, CitaListFilters } from "@/types/cita";

export interface ICitaRepository {
  list(userId: string): Promise<Cita[]>;
  findById(id: string, userId: string): Promise<Cita | null>;
  /** Ownership-unaware lookup. Service uses it to authorize updates. */
  findByIdRaw(id: string): Promise<Cita | null>;
  create(input: CreateCitaInput & { userId: string }): Promise<Cita>;
  update(id: string, userId: string, data: UpdateCitaInputData): Promise<Cita>;
  delete(id: string, userId: string): Promise<void>;
  findManyPaginated(
    userId: string,
    filters: CitaListFilters,
    skip: number,
    take: number,
  ): Promise<{ data: Cita[]; total: number }>;
}

/**
 * Subset of UpdateCitaInput that the repo accepts — without the `id`
 * (the repo already receives it positionally) and without any extra
 * fields the service might have added. Keeps the repository's surface
 * tight.
 */
export type UpdateCitaInputData = Omit<UpdateCitaInput, "id">;

const DEFAULT_ORDER: Prisma.CitaOrderByWithRelationInput[] = [
  { fecha: "asc" },
  { hora: "asc" },
];

function buildWhere(
  userId: string,
  filters: CitaListFilters,
): Prisma.CitaWhereInput {
  const where: Prisma.CitaWhereInput = { userId };
  if (filters.nombre) {
    where.nombre = { contains: filters.nombre, mode: "insensitive" };
  }
  if (filters.lugar) {
    where.lugar = { contains: filters.lugar, mode: "insensitive" };
  }
  if (filters.fecha) {
    const [y, m, d] = filters.fecha.split("-").map(Number);
    if (y && m && d) {
      const start = new Date(Date.UTC(y, m - 1, d));
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      where.fecha = { gte: start, lt: end };
    }
  }
  return where;
}

class CitaRepository implements ICitaRepository {
  async list(userId: string): Promise<Cita[]> {
    return prisma.cita.findMany({ where: { userId }, orderBy: DEFAULT_ORDER });
  }

  async findById(id: string, userId: string): Promise<Cita | null> {
    return prisma.cita.findFirst({ where: { id, userId } });
  }

  async findByIdRaw(id: string): Promise<Cita | null> {
    return prisma.cita.findUnique({ where: { id } });
  }

  async create(input: CreateCitaInput & { userId: string }): Promise<Cita> {
    return prisma.cita.create({
      data: {
        userId: input.userId,
        nombre: input.nombre,
        fecha: input.fecha,
        hora: input.hora,
        lugar: input.lugar,
        archivoUrl: input.archivoUrl ?? null,
        archivoId: input.archivoId ?? null,
        archivoNombre: input.archivoNombre ?? null,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    data: UpdateCitaInputData,
  ): Promise<Cita> {
    return prisma.cita.update({
      where: { id, userId },
      data: {
        nombre: data.nombre,
        fecha: data.fecha,
        hora: data.hora,
        lugar: data.lugar,
        archivoUrl: data.archivoUrl ?? null,
        archivoId: data.archivoId ?? null,
        archivoNombre: data.archivoNombre ?? null,
      },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    // Compound where ensures we never delete someone else's cita even
    // by a buggy caller. P2005 (record not found) is a normal outcome.
    await prisma.cita.deleteMany({ where: { id, userId } });
  }

  async findManyPaginated(
    userId: string,
    filters: CitaListFilters,
    skip: number,
    take: number,
  ): Promise<{ data: Cita[]; total: number }> {
    const where = buildWhere(userId, filters);
    const [data, total] = await prisma.$transaction([
      prisma.cita.findMany({
        where,
        skip,
        take,
        orderBy: DEFAULT_ORDER,
      }),
      prisma.cita.count({ where }),
    ]);
    return { data, total };
  }
}

export const citaRepository: ICitaRepository = new CitaRepository();
