"use client";

import { useTransition } from "react";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/cn";

interface LogoutButtonProps {
  className?: string;
  label?: string;
}

/**
 * Calls the logout Server Action. We use a tiny inline form (instead of
 * a <button onClick>) so the action runs even when JS is disabled —
 * Server Actions in <form action={...}> work with progressive
 * enhancement.
 */
export function LogoutButton({ className, label = "Cerrar sesión" }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await logoutAction();
        });
      }}
      className={className}
    >
      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "inline-flex h-9 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm font-medium text-zinc-200 transition-colors",
          "hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {isPending ? "Saliendo…" : label}
      </button>
    </form>
  );
}
