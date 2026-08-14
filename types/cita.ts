import type { Cita as PrismaCita } from "@/lib/generated/prisma/client";

/**
 * Domain Cita shape. Mirrors the Prisma model but with non-null `id` and
 * timestamp fields narrowed for app-side usage.
 */
export type Cita = PrismaCita;

/**
 * Wire shape returned to the browser. Server Actions serialize Date
 * fields to ISO strings, so we type them explicitly as strings here to
 * match the runtime.
 */
export interface CitaDTO {
  id: string;
  nombre: string;
  /** ISO-8601 date string (UTC). */
  fecha: string;
  /** "HH:MM" (24h). */
  hora: string;
  lugar: string;
  archivoUrl: string | null;
  archivoId: string | null;
  archivoNombre: string | null;
  /** ISO-8601 timestamp string. */
  createdAt: string;
  /** ISO-8601 timestamp string. */
  updatedAt: string;
}

export function toCitaDTO(cita: Cita): CitaDTO {
  return {
    id: cita.id,
    nombre: cita.nombre,
    fecha: cita.fecha.toISOString(),
    hora: cita.hora,
    lugar: cita.lugar,
    archivoUrl: cita.archivoUrl,
    archivoId: cita.archivoId,
    archivoNombre: cita.archivoNombre,
    createdAt: cita.createdAt.toISOString(),
    updatedAt: cita.updatedAt.toISOString(),
  };
}

/**
 * Structural type used by view components (cards, lists). Accepts both
 * the server-side `Cita` (with `Date` fields) and the wire-shape `CitaDTO`
 * (with `string` fields), so the same component can be rendered from
 * either side.
 */
export interface CitaView {
  id: string;
  nombre: string;
  fecha: string | Date;
  hora: string;
  lugar: string;
  archivoUrl: string | null;
  archivoId: string | null;
  archivoNombre: string | null;
}

/**
 * Input shape for creating a Cita, derived from the Prisma model.
 * `archivoUrl/Id/Nombre` are optional because the file upload is optional.
 */
export interface CreateCitaInput {
  nombre: string;
  fecha: Date;
  hora: string;
  lugar: string;
  archivoUrl?: string | null;
  archivoId?: string | null;
  archivoNombre?: string | null;
}

export interface UpdateCitaInput {
  id: string;
  nombre: string;
  fecha: Date;
  hora: string;
  lugar: string;
  archivoUrl?: string | null;
  archivoId?: string | null;
  archivoNombre?: string | null;
}

// ---------------------------------------------------------------------------
// Filters + pagination
// ---------------------------------------------------------------------------

export interface CitaListFilters {
  nombre?: string;
  lugar?: string;
  /** "YYYY-MM-DD" — exact day match (UTC). */
  fecha?: string;
}

export interface CitaListInput {
  filters?: CitaListFilters;
  offset: number;
  limit: number;
}

export interface CitaListResult {
  data: CitaDTO[];
  total: number;
}
