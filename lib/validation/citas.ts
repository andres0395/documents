import { z } from "zod";
import { ALLOWED_FILE_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/constants";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const citaFormSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre de la cita es obligatorio")
    .max(200, "El nombre no puede tener más de 200 caracteres"),
  fecha: z
    .string()
    .regex(DATE_REGEX, "La fecha es obligatoria"),
  hora: z
    .string()
    .regex(TIME_REGEX, "La hora es obligatoria y debe tener formato HH:MM"),
  lugar: z
    .string()
    .trim()
    .min(1, "El lugar es obligatorio")
    .max(200, "El lugar no puede tener más de 200 caracteres"),
});

export type CitaFormInput = z.infer<typeof citaFormSchema>;

export const citaFileSchema = z
  .instanceof(File, { message: "Archivo inválido" })
  .refine((file) => file.size > 0, "El archivo está vacío")
  .refine(
    (file) => file.size <= MAX_FILE_SIZE_BYTES,
    "El archivo no puede superar los 10 MB",
  )
  .refine(
    (file) =>
      (ALLOWED_FILE_MIME_TYPES as readonly string[]).includes(file.type),
    "Solo se permiten imágenes (PNG, JPG, WEBP) o PDF",
  )
  .optional();

const citaListFiltersSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .max(200, "El filtro de nombre es demasiado largo")
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    lugar: z
      .string()
      .trim()
      .max(200, "El filtro de lugar es demasiado largo")
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    fecha: z
      .string()
      .regex(DATE_REGEX, "La fecha del filtro debe tener formato YYYY-MM-DD")
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .optional();

export const listCitasQuerySchema = z.object({
  filters: citaListFiltersSchema,
  offset: z.number().int().min(0, "El offset no puede ser negativo").max(1000),
  limit: z.number().int().min(1, "El límite debe ser al menos 1").max(50, "El límite máximo es 50"),
});

export type ListCitasQuery = z.infer<typeof listCitasQuerySchema>;
