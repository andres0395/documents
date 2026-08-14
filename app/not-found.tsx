import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-950 px-4 text-center text-zinc-100">
      <h1 className="text-2xl font-semibold">Página no encontrada</h1>
      <p className="max-w-md text-sm text-zinc-400">
        La ruta que buscás no existe o fue movida.
      </p>
      <Link
        href="/citas"
        className="inline-flex h-10 items-center justify-center rounded-md bg-indigo-500 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
      >
        Volver a mis citas
      </Link>
    </div>
  );
}
