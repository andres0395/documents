/**
 * Email template for the daily cita reminder.
 *
 * Returns { subject, html, text }. Plain text is included for clients
 * that refuse HTML (rare, but cheap to provide). HTML uses inline
 * styles for the best chance of rendering correctly in Gmail / Apple
 * Mail / Outlook 365.
 */

import { formatCitaFechaCorta, formatCitaFecha } from "@/lib/date";
import { APP_NAME } from "@/lib/constants";
import type { Cita } from "@/types/cita";

export type ReminderKind = "today" | "tomorrow";

export interface ReminderItem {
  cita: Cita;
  kind: ReminderKind;
}

export interface RenderedReminder {
  subject: string;
  html: string;
  text: string;
  count: number;
}

const COLORS = {
  bg: "#09090b",
  surface: "#18181b",
  border: "#27272a",
  text: "#f4f4f5",
  muted: "#a1a1aa",
  accent: "#6366f1",
  accentText: "#a5b4fc",
  emeraldBg: "#022c22",
  emeraldText: "#34d399",
  indigoBg: "#1e1b4b",
  indigoText: "#a5b4fc",
  link: "#a5b4fc",
} as const;

function dateLabel(fecha: Date | string): string {
  return formatCitaFechaCorta(fecha);
}

function dayLabel(kind: ReminderKind): string {
  return kind === "today" ? "HOY" : "MAÑANA";
}

function pluralize(count: number): string {
  if (count === 1) return "1 cita";
  return `${count} citas`;
}

function buildSubject(items: ReminderItem[]): string {
  if (items.length === 0) return "Citas — sin recordatorios";
  const hasToday = items.some((i) => i.kind === "today");
  const hasTomorrow = items.some((i) => i.kind === "tomorrow");
  const range = hasToday && hasTomorrow
    ? "hoy y mañana"
    : hasToday
      ? "hoy"
      : "mañana";
  return `Recordatorio: tenés ${pluralize(items.length)} para ${range}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(items: ReminderItem[]): string {
  const totalLabel = pluralize(items.length);

  const cards = items
    .map(({ cita, kind }) => {
      const badgeBg = kind === "today" ? COLORS.emeraldBg : COLORS.indigoBg;
      const badgeText = kind === "today" ? COLORS.emeraldText : COLORS.indigoText;
      const fileRow = cita.archivoUrl
        ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: ${COLORS.muted};">
             📎 <a href="${escapeHtml(cita.archivoUrl)}" style="color: ${COLORS.link}; text-decoration: underline;">Ver archivo adjunto</a>
           </p>`
        : "";

      return `
        <tr>
          <td style="padding: 0 0 12px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
              style="background: ${COLORS.surface}; border: 1px solid ${COLORS.border}; border-radius: 10px; padding: 16px 18px;">
              <tr>
                <td>
                  <p style="margin: 0 0 8px 0;">
                    <span style="display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; background: ${badgeBg}; color: ${badgeText};">
                      ${dayLabel(kind)}
                    </span>
                  </p>
                  <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: ${COLORS.text};">
                    ${escapeHtml(cita.nombre)}
                  </p>
                  <p style="margin: 2px 0; font-size: 13px; color: ${COLORS.muted};">
                    📅 <span style="color: ${COLORS.text};">${escapeHtml(dateLabel(cita.fecha))}</span>
                    &nbsp;·&nbsp;
                    🕐 <span style="color: ${COLORS.text};">${escapeHtml(cita.hora)}</span>
                  </p>
                  <p style="margin: 2px 0; font-size: 13px; color: ${COLORS.muted};">
                    📍 <span style="color: ${COLORS.text};">${escapeHtml(cita.lugar)}</span>
                  </p>
                  ${fileRow}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Recordatorio de citas</title>
</head>
<body style="margin: 0; padding: 0; background: ${COLORS.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: ${COLORS.text};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
    style="background: ${COLORS.bg}; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
          style="max-width: 600px; width: 100%;">
          <tr>
            <td style="padding: 0 0 20px 0;">
              <p style="margin: 0; font-size: 12px; letter-spacing: 0.12em; color: ${COLORS.muted}; text-transform: uppercase;">
                ${APP_NAME} · recordatorio diario
              </p>
              <h1 style="margin: 6px 0 0 0; font-size: 22px; font-weight: 600; color: ${COLORS.text};">
                Tenés ${totalLabel} programada${items.length === 1 ? "" : "s"}
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: ${COLORS.muted};">
                Acá está el detalle para ${items.every((i) => i.kind === "today") ? "hoy" : items.every((i) => i.kind === "tomorrow") ? "mañana" : "hoy y mañana"}.
              </p>
            </td>
          </tr>
          ${cards}
          <tr>
            <td style="padding: 16px 0 0 0; border-top: 1px solid ${COLORS.border};">
              <p style="margin: 0; font-size: 12px; color: ${COLORS.muted}; text-align: center;">
                Recordatorio automático · generado por el sistema de Citas
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildText(items: ReminderItem[]): string {
  if (items.length === 0) {
    return "No tenés citas para hoy ni para mañana.";
  }

  const lines: string[] = [];
  lines.push(`Tenés ${pluralize(items.length)} programada${items.length === 1 ? "" : "s"}:`);
  lines.push("");

  for (const { cita, kind } of items) {
    lines.push(`— ${dayLabel(kind)} · ${cita.nombre}`);
    lines.push(`  Fecha: ${formatCitaFecha(cita.fecha)}`);
    lines.push(`  Hora:  ${cita.hora}`);
    lines.push(`  Lugar: ${cita.lugar}`);
    if (cita.archivoUrl) {
      lines.push(`  Archivo: ${cita.archivoUrl}`);
    }
    lines.push("");
  }

  lines.push("— Citas");
  return lines.join("\n");
}

export function renderDailyReminder(items: ReminderItem[]): RenderedReminder {
  // Sort: today first, then tomorrow; within each, by hora.
  const order: Record<ReminderKind, number> = { today: 0, tomorrow: 1 };
  const sorted = [...items].sort((a, b) => {
    if (a.kind !== b.kind) return order[a.kind] - order[b.kind];
    return a.cita.hora.localeCompare(b.cita.hora);
  });

  return {
    subject: buildSubject(sorted),
    html: buildHtml(sorted),
    text: buildText(sorted),
    count: sorted.length,
  };
}

/**
 * Used by the `NoFilterResults`-style "nothing to do" path: returns a
 * neutral subject/text so the API can respond 200 with a clear "no
 * citas" status instead of sending a confusing empty email.
 */
export function noCitasToReport(recipient: string): RenderedReminder {
  return {
    subject: "Citas — sin recordatorios",
    html: `<p>Hola: no hay citas para hoy ni para mañana${recipient ? ` (${escapeHtml(recipient)})` : ""}.</p>`,
    text: `No hay citas para hoy ni para mañana${recipient ? ` (${recipient})` : ""}.`,
    count: 0,
  };
}
