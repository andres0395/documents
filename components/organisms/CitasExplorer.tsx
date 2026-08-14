"use client";

import { useRef, useState, useTransition } from "react";
import { AppointmentList } from "@/components/organisms/AppointmentList";
import { EmptyCitas } from "@/components/organisms/EmptyCitas";
import { CitasFilters } from "@/components/organisms/CitasFilters";
import { LoadMoreButton } from "@/components/molecules/LoadMoreButton";
import { listCitasAction } from "@/actions/citas";
import type { CitaListFilters, CitaListResult } from "@/types/cita";

interface CitasExplorerProps {
  /** First page rendered on the server. */
  initial: CitaListResult;
  /** Page size for both the initial fetch and "load more". */
  pageSize?: number;
}

const EMPTY_FILTERS: CitaListFilters = {};

/**
 * Owns the client-side state of the citas list:
 *   - filters (nombre, lugar, fecha)
 *   - citas (the current page(s))
 *   - offset / total (for pagination)
 *
 * The Server Component hands off the first page. After that, every
 * filter change and every "load more" goes through `listCitasAction`.
 * Pending UI comes from `useTransition` so the page stays responsive
 * while a request is in flight.
 */
export function CitasExplorer({
  initial,
  pageSize = 6,
}: CitasExplorerProps) {
  const [filters, setFilters] = useState<CitaListFilters>(EMPTY_FILTERS);
  const [citas, setCitas] = useState(initial.data);
  const [total, setTotal] = useState(initial.total);
  const [offset, setOffset] = useState(initial.data.length);
  const [isPending, startTransition] = useTransition();

  // Guards against out-of-order responses when the user types quickly.
  // Each request gets a tag; only the newest one is allowed to mutate state.
  const requestIdRef = useRef(0);

  const hasMore = offset < total;
  const hasActiveFilters = Boolean(
    filters.nombre || filters.lugar || filters.fecha,
  );
  const showResults = citas.length > 0;
  const showNoDataEmpty = !showResults && !hasActiveFilters;
  const showNoMatch = !showResults && hasActiveFilters;

  /**
   * Optimistic delete: remove the card from local state immediately
   * after the server confirms the deletion. The action also revalidates
   * `/citas`, so the next full-page load will be consistent.
   *
   * Without this, `revalidatePath` only refreshes the Server Component
   * cache — the explorer's `citas` state (Client-side) stays stale and
   * the user sees the deleted card until they reload.
   */
  const handleDeleted = (deletedId: string) => {
    setCitas((prev) => prev.filter((c) => c.id !== deletedId));
    setTotal((prev) => Math.max(0, prev - 1));
    setOffset((prev) => Math.max(0, prev - 1));
  };

  const applyFilters = (next: CitaListFilters) => {
    setFilters(next);
    const id = ++requestIdRef.current;
    startTransition(async () => {
      const result = await listCitasAction({
        filters: next,
        offset: 0,
        limit: pageSize,
      });
      if (id !== requestIdRef.current) return; // stale response
      setCitas(result.data);
      setTotal(result.total);
      setOffset(result.data.length);
    });
  };

  const handleReset = () => applyFilters(EMPTY_FILTERS);

  const handleLoadMore = () => {
    if (!hasMore || isPending) return;
    const id = ++requestIdRef.current;
    startTransition(async () => {
      const result = await listCitasAction({
        filters,
        offset,
        limit: pageSize,
      });
      if (id !== requestIdRef.current) return; // stale response
      setCitas((prev) => [...prev, ...result.data]);
      setOffset((prev) => prev + result.data.length);
      // total may have changed if filters were re-applied between clicks
      setTotal(result.total);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <CitasFilters
        filters={filters}
        onChange={applyFilters}
        onReset={handleReset}
        isPending={isPending}
      />

      {showNoDataEmpty ? (
        <EmptyCitas />
      ) : showNoMatch ? (
        <NoFilterResults onReset={handleReset} />
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span aria-live="polite">
              {isPending
                ? "Actualizando…"
                : `Mostrando ${citas.length} de ${total} cita${
                    total === 1 ? "" : "s"
                  }${hasActiveFilters ? " (filtradas)" : ""}`}
            </span>
          </div>
          <div
            className={
              isPending
                ? "pointer-events-none opacity-60 transition-opacity"
                : "transition-opacity"
            }
            aria-busy={isPending}
          >
            <AppointmentList citas={citas} onDeleted={handleDeleted} />
          </div>
          <LoadMoreButton
            hasMore={hasMore}
            loading={isPending}
            onClick={handleLoadMore}
            endLabel="No hay más citas para mostrar"
          />
        </>
      )}
    </div>
  );
}

function NoFilterResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center">
      <p className="text-sm text-zinc-400">
        No hay citas que coincidan con los filtros aplicados.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="text-sm font-medium text-indigo-300 underline underline-offset-2 hover:text-indigo-200"
      >
        Limpiar filtros
      </button>
    </div>
  );
}
