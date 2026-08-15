/**
 * Domain date formatters for Citas.
 * Kept in Spanish because the domain is in Spanish and the user is in es-CO.
 */

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

export const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "UTC",
});

export function formatCitaFecha(fecha: Date | string): string {
  const date = typeof fecha === "string" ? new Date(fecha) : fecha;
  return LONG_DATE_FORMATTER.format(date);
}

export function formatCitaFechaCorta(fecha: Date | string): string {
  const date = typeof fecha === "string" ? new Date(fecha) : fecha;
  return SHORT_DATE_FORMATTER.format(date);
}

/**
 * Convert a Date to a "YYYY-MM-DD" string suitable for <input type="date">.
 */
export function toDateInputValue(fecha: Date | string): string {
  const date = typeof fecha === "string" ? new Date(fecha) : fecha;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse a "YYYY-MM-DD" string (from <input type="date">) into a Date at UTC midnight.
 * Using UTC avoids timezone drift when reading the value back from a date input.
 */
export function fromDateInputValue(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error("Invalid date value");
  }
  return new Date(Date.UTC(year, month - 1, day));
}
