"use client";

import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/cn";

interface LoadMoreButtonProps {
  hasMore: boolean;
  onClick: () => void;
  loading?: boolean;
  loadingLabel?: string;
  idleLabel?: string;
  endLabel?: string;
  className?: string;
}

/**
 * Generic "load more" button used by paginated lists. Renders nothing
 * (or an "end of list" hint) when there are no more items to load.
 */
export function LoadMoreButton({
  hasMore,
  onClick,
  loading = false,
  loadingLabel = "Cargando…",
  idleLabel = "Cargar más",
  endLabel,
  className,
}: LoadMoreButtonProps) {
  if (!hasMore) {
    if (!endLabel) return null;
    return (
      <p
        className={cn(
          "py-4 text-center text-xs text-zinc-500",
          className,
        )}
      >
        {endLabel}
      </p>
    );
  }

  return (
    <div className={cn("flex justify-center pt-2", className)}>
      <Button
        type="button"
        variant="secondary"
        onClick={onClick}
        disabled={loading}
        fullWidth
        className="sm:max-w-xs"
      >
        {loading ? loadingLabel : idleLabel}
      </Button>
    </div>
  );
}
