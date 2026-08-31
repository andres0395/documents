"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { deleteUserAction } from "@/actions/users";

interface DeleteUserButtonProps {
  userId: string;
  userLabel: string;
  /**
   * Called after the server confirms the deletion. The parent uses this
   * to remove the row from local state immediately (optimistic UI).
   * Only invoked when `disabled` is false.
   */
  onDeleted?: (userId: string) => void;
  /**
   * If true, the button is rendered disabled with a tooltip — used to
   * stop the user from trying to delete themselves from the UI. The
   * service layer enforces the same rule as defense in depth.
   */
  disabled?: boolean;
  disabledReason?: string;
}

/**
 * Same inline-confirm pattern as DeleteCitaButton. Lets the admin
 * confirm the destructive action without a modal.
 */
export function DeleteUserButton({
  userId,
  userLabel,
  onDeleted,
  disabled,
  disabledReason,
}: DeleteUserButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (isPending) return;
    const formData = new FormData();
    formData.append("id", userId);
    setError(null);
    startTransition(async () => {
      try {
        await deleteUserAction(formData);
        // Optimistic removal happens via the parent's state; the
        // server revalidates the admin route to keep server data in
        // sync.
        setConfirming(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudo eliminar el usuario",
        );
      }
    });
  };

  if (disabled) {
    return (
      <Button type="button" variant="danger" size="sm" disabled title={disabledReason}>
        Eliminar
      </Button>
    );
  }

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
        <span className="text-xs text-zinc-400">¿Eliminar a &quot;{userLabel}&quot;?</span>
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
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
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
