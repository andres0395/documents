"use client";

import { useEffect } from "react";
import { Button } from "@/components/atoms/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the server console; the production runtime will surface it.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4 text-center text-zinc-100">
      <h1 className="text-2xl font-semibold">Algo salió mal</h1>
      <p className="max-w-md text-sm text-zinc-400">
        Ocurrió un error inesperado. Podés intentar de nuevo; si el problema
        persiste, revisa la configuración del servidor.
      </p>
      {error.digest ? (
        <p className="text-xs text-zinc-500">ID: {error.digest}</p>
      ) : null}
      <Button variant="primary" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
