import { citaRepository } from "@/repositories/citas";
import { googleDrive } from "@/services/google-drive";
import type { Cita, CreateCitaInput, UpdateCitaInput, CitaListFilters } from "@/types/cita";

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface CitaFormPayload {
  nombre: string;
  fecha: Date;
  hora: string;
  lugar: string;
  file?: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  };
}

function safeFileBaseName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "cita";
  return trimmed.replace(/[\\/:*?"<>|]/g, "-").slice(0, 80);
}

function buildDriveFolderName(nombre: string): string {
  return safeFileBaseName(nombre);
}

export const citaService = {
  async list(): Promise<Cita[]> {
    return citaRepository.list();
  },

  async listPaginated(
    filters: CitaListFilters,
    offset: number,
    limit: number,
  ): Promise<{ data: Cita[]; total: number }> {
    return citaRepository.findManyPaginated(filters, offset, limit);
  },

  async findById(id: string): Promise<Cita | null> {
    return citaRepository.findById(id);
  },

  async create(payload: CitaFormPayload): Promise<ServiceResult<Cita>> {
    if (!payload.nombre.trim()) {
      return { ok: false, error: "El nombre de la cita es obligatorio" };
    }
    if (!payload.lugar.trim()) {
      return { ok: false, error: "El lugar es obligatorio" };
    }
    if (!payload.hora.trim()) {
      return { ok: false, error: "La hora es obligatoria" };
    }

    let archivoUrl: string | null = null;
    let archivoId: string | null = null;
    let archivoNombre: string | null = null;

    if (payload.file) {
      try {
        const uploaded = await googleDrive.uploadAppointmentFile({
          folderName: buildDriveFolderName(payload.nombre),
          file: {
            buffer: payload.file.buffer,
            filename: payload.file.filename,
          },
        });
        archivoUrl = uploaded.url;
        archivoId = uploaded.fileId;
        archivoNombre = uploaded.fileName;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al subir el archivo a Drive";
        return { ok: false, error: message };
      }
    }

    const input: CreateCitaInput = {
      nombre: payload.nombre.trim(),
      fecha: payload.fecha,
      hora: payload.hora,
      lugar: payload.lugar.trim(),
      archivoUrl,
      archivoId,
      archivoNombre,
    };

    const cita = await citaRepository.create(input);
    return { ok: true, data: cita };
  },

  async update(payload: CitaFormPayload & { id: string }): Promise<ServiceResult<Cita>> {
    const existing = await citaRepository.findById(payload.id);
    if (!existing) {
      return { ok: false, error: "La cita no existe" };
    }

    if (!payload.nombre.trim()) {
      return { ok: false, error: "El nombre de la cita es obligatorio" };
    }
    if (!payload.lugar.trim()) {
      return { ok: false, error: "El lugar es obligatorio" };
    }
    if (!payload.hora.trim()) {
      return { ok: false, error: "La hora es obligatoria" };
    }

    let archivoUrl: string | null | undefined = undefined;
    let archivoId: string | null | undefined = undefined;
    let archivoNombre: string | null | undefined = undefined;

    if (payload.file) {
      try {
        const uploaded = await googleDrive.uploadAppointmentFile({
          folderName: buildDriveFolderName(payload.nombre),
          file: {
            buffer: payload.file.buffer,
            filename: payload.file.filename,
          },
        });
        archivoUrl = uploaded.url;
        archivoId = uploaded.fileId;
        archivoNombre = uploaded.fileName;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al subir el archivo a Drive";
        return { ok: false, error: message };
      }
    }

    const input: UpdateCitaInput = {
      id: payload.id,
      nombre: payload.nombre.trim(),
      fecha: payload.fecha,
      hora: payload.hora,
      lugar: payload.lugar.trim(),
      archivoUrl,
      archivoId,
      archivoNombre,
    };

    const cita = await citaRepository.update(input);
    return { ok: true, data: cita };
  },

  async delete(id: string): Promise<ServiceResult<true>> {
    const existing = await citaRepository.findById(id);
    if (!existing) {
      return { ok: false, error: "La cita no existe" };
    }
    await citaRepository.delete(id);
    return { ok: true, data: true };
  },
};
