import Link from "next/link";
import { Button } from "@/components/atoms/Button";

export function EmptyCitas() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-16 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-400"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-zinc-100">No tienes citas todavía</h2>
      <p className="max-w-sm text-sm text-zinc-400">
        Crea tu primera cita para empezar a llevar un registro de tus
        compromisos.
      </p>
      <Link href="/citas/nueva">
        <Button variant="primary">Crear primera cita</Button>
      </Link>
    </div>
  );
}
