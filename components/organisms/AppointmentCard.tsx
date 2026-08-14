"use client";

import Link from "next/link";
import { Badge } from "@/components/atoms/Badge";
import { DeleteCitaButton } from "@/components/molecules/DeleteCitaButton";
import { formatCitaFecha, formatCitaFechaCorta } from "@/lib/date";
import type { CitaView } from "@/types/cita";

interface AppointmentCardProps {
  cita: CitaView;
  /**
   * Forwarded to the DeleteCitaButton so the explorer can remove the
   * card optimistically. Marked optional so the card still works in
   * contexts that don't care (e.g. SSR-only previews in the future).
   */
  onDeleted?: (citaId: string) => void;
}

function isPast(cita: CitaView): boolean {
  const citaDate = new Date(cita.fecha);
  const [hh, mm] = cita.hora.split(":").map(Number);
  if (hh === undefined || mm === undefined) return citaDate.getTime() < Date.now();
  citaDate.setHours(hh, mm, 0, 0);
  return citaDate.getTime() < Date.now();
}

export function AppointmentCard({ cita, onDeleted }: AppointmentCardProps) {
  const past = isPast(cita);
  return (
    <article
      className="group relative flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-zinc-100">
              {cita.nombre}
            </h3>
            {past ? (
              <Badge tone="neutral">Pasada</Badge>
            ) : (
              <Badge tone="emerald">Próxima</Badge>
            )}
          </div>
          <p className="text-xs text-zinc-500" title={formatCitaFecha(cita.fecha)}>
            {formatCitaFecha(cita.fecha)}
          </p>
        </div>
      </header>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Fecha</dt>
          <dd className="text-sm text-zinc-200">
            {formatCitaFechaCorta(cita.fecha)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Hora</dt>
          <dd className="text-sm text-zinc-200">{cita.hora}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Lugar</dt>
          <dd className="text-sm text-zinc-200">{cita.lugar}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Archivo</dt>
          <dd className="text-sm text-zinc-200">
            {cita.archivoUrl ? (
              <a
                href={cita.archivoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-300 underline underline-offset-2 hover:text-indigo-200"
              >
                {cita.archivoNombre ?? "Ver archivo"}
              </a>
            ) : (
              <span className="text-zinc-500">Sin archivo adjunto</span>
            )}
          </dd>
        </div>
      </dl>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-4">
        <Link
          href={`/citas/${cita.id}`}
          className="text-sm font-medium text-indigo-300 hover:text-indigo-200"
        >
          Editar →
        </Link>
        <DeleteCitaButton
          citaId={cita.id}
          citaName={cita.nombre}
          onDeleted={onDeleted}
        />
      </footer>
    </article>
  );
}
