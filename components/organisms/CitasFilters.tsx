"use client";

import { SearchInput } from "@/components/molecules/SearchInput";
import { DateFilter } from "@/components/molecules/DateFilter";
import { Button } from "@/components/atoms/Button";
import type { CitaListFilters } from "@/types/cita";

interface CitasFiltersProps {
  filters: CitaListFilters;
  onChange: (filters: CitaListFilters) => void;
  onReset?: () => void;
  isPending?: boolean;
}

/**
 * Filter bar for the citas list. Composes the generic SearchInput /
 * DateFilter atoms. Text filters debounce internally; the date filter
 * fires on change.
 */
export function CitasFilters({
  filters,
  onChange,
  onReset,
  isPending = false,
}: CitasFiltersProps) {
  const hasActiveFilters = Boolean(
    filters.nombre || filters.lugar || filters.fecha,
  );

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SearchInput
          label="Buscar por nombre"
          placeholder="Ej. Revisión médica"
          defaultValue={filters.nombre ?? ""}
          onDebouncedChange={(nombre) =>
            onChange({ ...filters, nombre: nombre || undefined })
          }
        />
        <SearchInput
          label="Buscar por lugar"
          placeholder="Ej. Clínica del Norte"
          defaultValue={filters.lugar ?? ""}
          onDebouncedChange={(lugar) =>
            onChange({ ...filters, lugar: lugar || undefined })
          }
        />
        <DateFilter
          label="Filtrar por fecha"
          value={filters.fecha ?? ""}
          onChange={(fecha) => onChange({ ...filters, fecha: fecha || undefined })}
        />
      </div>

      {onReset ? (
        <div className="mt-3 flex items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={!hasActiveFilters || isPending}
          >
            Limpiar filtros
          </Button>
        </div>
      ) : null}
    </div>
  );
}
