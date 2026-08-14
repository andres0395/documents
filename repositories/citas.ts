import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { Cita, CreateCitaInput, UpdateCitaInput, CitaListFilters } from "@/types/cita";

export interface ICitaRepository {
  list(): Promise<Cita[]>;
  findById(id: string): Promise<Cita | null>;
  create(input: CreateCitaInput): Promise<Cita>;
  update(input: UpdateCitaInput): Promise<Cita>;
  delete(id: string): Promise<void>;
  findManyPaginated(
    filters: CitaListFilters,
    skip: number,
    take: number,
  ): Promise<{ data: Cita[]; total: number }>;
}

const DEFAULT_ORDER: Prisma.CitaOrderByWithRelationInput[] = [
  { fecha: "asc" },
  { hora: "asc" },
];

function buildWhere(filters: CitaListFilters): Prisma.CitaWhereInput {
  const where: Prisma.CitaWhereInput = {};
  if (filters.nombre) {
    where.nombre = { contains: filters.nombre, mode: "insensitive" };
  }
  if (filters.lugar) {
    where.lugar = { contains: filters.lugar, mode: "insensitive" };
  }
  if (filters.fecha) {
    // Match the entire day in UTC. `fromDateInputValue` stores the date
    // as 00:00 UTC, so we want [startOfDay, startOfNextDay).
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
  async list(): Promise<Cita[]> {
    return prisma.cita.findMany({ orderBy: DEFAULT_ORDER });
  }

  async findById(id: string): Promise<Cita | null> {
    return prisma.cita.findUnique({ where: { id } });
  }

  async create(input: CreateCitaInput): Promise<Cita> {
    return prisma.cita.create({
      data: {
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

  async update(input: UpdateCitaInput): Promise<Cita> {
    return prisma.cita.update({
      where: { id: input.id },
      data: {
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

  async delete(id: string): Promise<void> {
    await prisma.cita.delete({ where: { id } });
  }

  async findManyPaginated(
    filters: CitaListFilters,
    skip: number,
    take: number,
  ): Promise<{ data: Cita[]; total: number }> {
    const where = buildWhere(filters);
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
