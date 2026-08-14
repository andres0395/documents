"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { deleteCitaAction } from "@/actions/citas";

interface DeleteCitaButtonProps {
  citaId: string;
  citaName: string;
  /**
   * Called after the server confirms the cita was deleted (or was
   * already gone — idempotent). The parent uses this to remove the
   * card from local state immediately (optimistic UI), instead of
   * waiting for `revalidatePath` to ripple through the page.
   */
  onDeleted?: (citaId: string) => void;
}

export function DeleteCitaButton({
  citaId,
  citaName,
  onDeleted,
}: DeleteCitaButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (isPending) return;
    const formData = new FormData();
    formData.append("id", citaId);
    setError(null);

    startTransition(async () => {
      const result = await deleteCitaAction(formData);
      if (result.ok) {
        // The server may have revalidated /citas but that doesn't reach
        // this card's parent's local state. Optimistically remove the
        // cita so the UI reflects the deletion immediately.
        onDeleted?.(citaId);
        setConfirming(false);
      } else {
        setError(result.error ?? "No se pudo eliminar la cita");
      }
    });
  };

  const handleCancel = () => {
    setConfirming(false);
    setError(null);
  };

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        Eliminar
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">
          ¿Eliminar &quot;{citaName}&quot;?
        </span>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={handleConfirm}
          disabled={isPending}
        >
          {isPending ? "Eliminando…" : "Confirmar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-xs font-medium text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
