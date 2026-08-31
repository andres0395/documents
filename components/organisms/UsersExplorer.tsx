"use client";

import { useRef, useState, useTransition } from "react";
import { UserList } from "@/components/organisms/UserList";
import { SearchInput } from "@/components/molecules/SearchInput";
import { DateFilter } from "@/components/molecules/DateFilter";
import { LoadMoreButton } from "@/components/molecules/LoadMoreButton";
import { listUsersAction, type ListUsersResult } from "@/actions/users";
import { isRoleName, type RoleName, type UserPublic } from "@/types/user";
import { cn } from "@/lib/cn";

interface UsersExplorerProps {
  initial: ListUsersResult;
  currentUserId: string;
  pageSize?: number;
}

interface FilterState {
  nombre?: string;
  email?: string;
  role?: RoleName;
}

const EMPTY_FILTERS: FilterState = {};

const ROLE_OPTIONS: { value: RoleName; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "editor", label: "Editor" },
];

export function UsersExplorer({
  initial,
  currentUserId,
  pageSize = 8,
}: UsersExplorerProps) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [users, setUsers] = useState<UserPublic[]>(initial.data);
  const [total, setTotal] = useState(initial.total);
  const [offset, setOffset] = useState(initial.data.length);
  const [isPending, startTransition] = useTransition();

  // Guard against out-of-order responses.
  const requestIdRef = useRef(0);

  const hasMore = offset < total;
  const hasActiveFilters = Boolean(
    filters.nombre || filters.email || filters.role,
  );

  const applyFilters = (next: FilterState) => {
    setFilters(next);
    const id = ++requestIdRef.current;
    startTransition(async () => {
      const result = await listUsersAction({
        filters: next,
        offset: 0,
        limit: pageSize,
      });
      if (id !== requestIdRef.current) return;
      setUsers(result.data);
      setTotal(result.total);
      setOffset(result.data.length);
    });
  };

  const handleReset = () => applyFilters(EMPTY_FILTERS);

  const handleLoadMore = () => {
    if (!hasMore || isPending) return;
    const id = ++requestIdRef.current;
    startTransition(async () => {
      const result = await listUsersAction({
        filters,
        offset,
        limit: pageSize,
      });
      if (id !== requestIdRef.current) return;
      setUsers((prev) => [...prev, ...result.data]);
      setOffset((prev) => prev + result.data.length);
      setTotal(result.total);
    });
  };

  /**
   * Optimistic delete: remove the row immediately. The server's
   * revalidatePath keeps the data in sync on the next full-page load.
   */
  const handleDeleted = (deletedId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== deletedId));
    setTotal((prev) => Math.max(0, prev - 1));
    setOffset((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SearchInput
            label="Buscar por nombre"
            placeholder="Ej. Juan"
            defaultValue={filters.nombre ?? ""}
            onDebouncedChange={(nombre) =>
              applyFilters({ ...filters, nombre: nombre || undefined })
            }
          />
          <SearchInput
            label="Buscar por email"
            placeholder="usuario@correo.com"
            defaultValue={filters.email ?? ""}
            onDebouncedChange={(email) =>
              applyFilters({ ...filters, email: email || undefined })
            }
          />
          <RoleSelect
            value={filters.role ?? ""}
            onChange={(role) =>
              applyFilters({
                ...filters,
                role: role && isRoleName(role) ? role : undefined,
              })
            }
          />
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasActiveFilters || isPending}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-4 text-sm font-medium text-zinc-100 transition-colors",
                "hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {users.length > 0 ? (
        <>
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span aria-live="polite">
              {isPending
                ? "Actualizando…"
                : `Mostrando ${users.length} de ${total} usuario${
                    total === 1 ? "" : "s"
                  }${hasActiveFilters ? " (filtrados)" : ""}`}
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
            <UserList
              users={users}
              currentUserId={currentUserId}
              filtered={hasActiveFilters}
              {...(hasActiveFilters ? { onResetFilters: handleReset } : {})}
              onDeleted={handleDeleted}
            />
          </div>
          <LoadMoreButton
            hasMore={hasMore}
            loading={isPending}
            onClick={handleLoadMore}
            endLabel="No hay más usuarios para mostrar"
          />
        </>
      ) : (
        <UserList
          users={users}
          currentUserId={currentUserId}
          filtered={hasActiveFilters}
          {...(hasActiveFilters ? { onResetFilters: handleReset } : {})}
        />
      )}
    </div>
  );
}

/**
 * Local helper: a Select that emits "admin" | "editor" | "" (no filter).
 * Kept inline because it has a single use site and a tighter shape
 * than the generic Select atom.
 */
function RoleSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="role-filter"
        className="text-sm font-medium text-zinc-200 inline-flex items-center gap-1"
      >
        Filtrar por rol
      </label>
      <div className="relative">
        <select
          id="role-filter"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-10 w-full appearance-none rounded-md border border-zinc-700 bg-zinc-900 px-3 pr-9 text-sm text-zinc-100",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:border-indigo-400",
          )}
        >
          <option value="">Todos los roles</option>
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
    </div>
  );
}
