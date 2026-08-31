import Link from "next/link";
import { Button } from "@/components/atoms/Button";

interface EmptyUsersProps {
  /**
   * Whether the empty list is caused by filters (no matches) or by a
   * truly empty database. Different copy + different CTA.
   */
  filtered?: boolean;
  onReset?: () => void;
}

export function EmptyUsers({ filtered, onReset }: EmptyUsersProps) {
  if (filtered) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center">
        <p className="text-sm text-zinc-400">
          No hay usuarios que coincidan con los filtros aplicados.
        </p>
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="text-sm font-medium text-indigo-300 underline underline-offset-2 hover:text-indigo-200"
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>
    );
  }

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
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-zinc-100">
        No hay usuarios todavía
      </h2>
      <p className="max-w-sm text-sm text-zinc-400">
        Creá el primer usuario para empezar a delegar el acceso a la
        aplicación.
      </p>
      <Link href="/admin/usuarios/nuevo">
        <Button variant="primary">Crear primer usuario</Button>
      </Link>
    </div>
  );
}
