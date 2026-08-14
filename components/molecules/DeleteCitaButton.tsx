"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { deleteCitaAction } from "@/actions/citas";

interface DeleteCitaButtonProps {
  citaId: string;
  citaName: string;
}

export function DeleteCitaButton({ citaId, citaName }: DeleteCitaButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    const formData = new FormData();
    formData.append("id", citaId);
    startTransition(async () => {
      await deleteCitaAction(formData);
    });
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
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-400">¿Eliminar &quot;{citaName}&quot;?</span>
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
        onClick={() => setConfirming(false)}
        disabled={isPending}
      >
        Cancelar
      </Button>
    </div>
  );
}
