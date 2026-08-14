"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { citaService } from "@/services/citas";
import { citaFormSchema, citaFileSchema, listCitasQuerySchema } from "@/lib/validation/citas";
import { fromDateInputValue } from "@/lib/date";
import { CITAS_REVALIDATE_TAG } from "@/lib/constants";
import { toCitaDTO, type CitaDTO, type CitaListInput, type CitaListResult } from "@/types/cita";

export interface CitaActionState {
  ok: boolean;
  message: string;
  values?: {
    nombre: string;
    fecha: string;
    hora: string;
    lugar: string;
  };
  fieldErrors?: Partial<Record<"nombre" | "fecha" | "hora" | "lugar" | "archivo", string>>;
  citaId?: string;
}

const EMPTY_VALUES = {
  nombre: "",
  fecha: "",
  hora: "",
  lugar: "",
};

function readSubmittedValues(formData: FormData) {
  return {
    nombre: fieldValue(formData, "nombre"),
    fecha: fieldValue(formData, "fecha"),
    hora: fieldValue(formData, "hora"),
    lugar: fieldValue(formData, "lugar"),
  };
}

function flattenZodErrors(
  error: import("zod").ZodError,
): CitaActionState["fieldErrors"] {
  const fieldErrors: CitaActionState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const path = issue.path[0];
    if (typeof path !== "string") continue;
    if (!fieldErrors[path as keyof NonNullable<CitaActionState["fieldErrors"]>]) {
      (fieldErrors as Record<string, string>)[path] = issue.message;
    }
  }
  return fieldErrors;
}

async function readFileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function fieldValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createCitaAction(
  _prev: CitaActionState,
  formData: FormData,
): Promise<CitaActionState> {
  const values = readSubmittedValues(formData);

  const parsedFields = citaFormSchema.safeParse(values);

  const fileEntry = formData.get("archivo");
  const parsedFile =
    fileEntry instanceof File && fileEntry.size > 0
      ? citaFileSchema.safeParse(fileEntry)
      : null;

  if (!parsedFields.success || (parsedFile && !parsedFile.success)) {
    const fieldErrors: CitaActionState["fieldErrors"] = {};
    if (!parsedFields.success) {
      Object.assign(fieldErrors, flattenZodErrors(parsedFields.error));
    }
    if (parsedFile && !parsedFile.success) {
      Object.assign(fieldErrors, flattenZodErrors(parsedFile.error));
    }
    return {
      ok: false,
      message: "Revisa los campos marcados",
      values,
      fieldErrors,
    };
  }

  let filePayload: { buffer: Buffer; filename: string; mimeType: string } | undefined;
  if (parsedFile?.success && parsedFile.data instanceof File) {
    const file = parsedFile.data;
    filePayload = {
      buffer: await readFileToBuffer(file),
      filename: file.name,
      mimeType: file.type,
    };
  }

  let fecha: Date;
  try {
    fecha = fromDateInputValue(parsedFields.data.fecha);
  } catch {
    return {
      ok: false,
      message: "Fecha inválida",
      values,
      fieldErrors: { fecha: "Fecha inválida" },
    };
  }

  const result = await citaService.create({
    nombre: parsedFields.data.nombre,
    fecha,
    hora: parsedFields.data.hora,
    lugar: parsedFields.data.lugar,
    file: filePayload,
  });

  if (!result.ok) {
    return { ok: false, message: result.error, values };
  }

  revalidatePath("/citas");
  revalidateTag(CITAS_REVALIDATE_TAG, "max");

  redirect("/citas");
}

export async function updateCitaAction(
  _prev: CitaActionState,
  formData: FormData,
): Promise<CitaActionState> {
  const id = fieldValue(formData, "id");
  if (!id) {
    return { ok: false, message: "Falta el identificador de la cita", values: EMPTY_VALUES };
  }

  const values = readSubmittedValues(formData);

  const parsedFields = citaFormSchema.safeParse(values);

  const fileEntry = formData.get("archivo");
  const parsedFile =
    fileEntry instanceof File && fileEntry.size > 0
      ? citaFileSchema.safeParse(fileEntry)
      : null;

  if (!parsedFields.success || (parsedFile && !parsedFile.success)) {
    const fieldErrors: CitaActionState["fieldErrors"] = {};
    if (!parsedFields.success) {
      Object.assign(fieldErrors, flattenZodErrors(parsedFields.error));
    }
    if (parsedFile && !parsedFile.success) {
      Object.assign(fieldErrors, flattenZodErrors(parsedFile.error));
    }
    return {
      ok: false,
      message: "Revisa los campos marcados",
      values,
      fieldErrors,
    };
  }

  let filePayload: { buffer: Buffer; filename: string; mimeType: string } | undefined;
  if (parsedFile?.success && parsedFile.data instanceof File) {
    const file = parsedFile.data;
    filePayload = {
      buffer: await readFileToBuffer(file),
      filename: file.name,
      mimeType: file.type,
    };
  }

  let fecha: Date;
  try {
    fecha = fromDateInputValue(parsedFields.data.fecha);
  } catch {
    return {
      ok: false,
      message: "Fecha inválida",
      values,
      fieldErrors: { fecha: "Fecha inválida" },
    };
  }

  const result = await citaService.update({
    id,
    nombre: parsedFields.data.nombre,
    fecha,
    hora: parsedFields.data.hora,
    lugar: parsedFields.data.lugar,
    file: filePayload,
  });

  if (!result.ok) {
    return { ok: false, message: result.error, values };
  }

  revalidatePath("/citas");
  revalidatePath(`/citas/${id}`);
  revalidateTag(CITAS_REVALIDATE_TAG, "max");

  redirect("/citas");
}

export async function deleteCitaAction(formData: FormData): Promise<void> {
  const id = fieldValue(formData, "id");
  if (!id) return;
  const result = await citaService.delete(id);
  if (!result.ok) {
    // We don't surface a per-field error here because the delete form has
    // a confirmation dialog; failures are extreme. Throw so the global
    // error boundary handles it.
    throw new Error(result.error);
  }
  revalidatePath("/citas");
  revalidateTag(CITAS_REVALIDATE_TAG, "max");
}

/**
 * Server Action used by the CitasExplorer to load cita pages (initial
 * load, filter changes, "load more"). Returns a flat shape so the client
 * can update its state without re-deriving anything.
 *
 * Server-side validation acts as defense-in-depth; the client always sends
 * a well-typed payload.
 */
export async function listCitasAction(
  input: CitaListInput,
): Promise<CitaListResult> {
  const parsed = listCitasQuerySchema.safeParse(input);
  if (!parsed.success) {
    // Treat invalid input as a query for "nothing" rather than throwing —
    // list actions should never crash the UI on a bad payload.
    return { data: [], total: 0 };
  }

  const { filters = {}, offset, limit } = parsed.data;

  const page = await citaService.listPaginated(filters, offset, limit);
  const data: CitaDTO[] = page.data.map(toCitaDTO);
  return { data, total: page.total };
}
