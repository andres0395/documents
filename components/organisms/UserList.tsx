"use client";

import Link from "next/link";
import { Badge } from "@/components/atoms/Badge";
import { DeleteUserButton } from "@/components/molecules/DeleteUserButton";
import { EmptyUsers } from "@/components/organisms/EmptyUsers";
import { formatCitaFechaCorta } from "@/lib/date";
import type { UserPublic } from "@/types/user";

interface UserListProps {
  users: UserPublic[];
  /** Current user's id — used to disable the self-delete button in the UI. */
  currentUserId: string;
  /** True if the empty state is caused by filters, not a real empty DB. */
  filtered?: boolean;
  /** When the list is filtered, allow resetting the filters from the empty state. */
  onResetFilters?: () => void;
  /** Optimistic delete: parent removes the row from its state. */
  onDeleted?: (userId: string) => void;
}

function formatDate(iso: string): string {
  try {
    return formatCitaFechaCorta(new Date(iso));
  } catch {
    return iso;
  }
}

function roleLabel(role: UserPublic["role"]): string {
  return role === "admin" ? "Administrador" : "Editor";
}

function roleTone(role: UserPublic["role"]): "indigo" | "neutral" {
  return role === "admin" ? "indigo" : "neutral";
}

export function UserList({
  users,
  currentUserId,
  filtered,
  onResetFilters,
  onDeleted,
}: UserListProps) {
  if (users.length === 0) {
    return (
      <EmptyUsers filtered={filtered} {...(onResetFilters ? { onReset: onResetFilters } : {})} />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Nombre
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Email
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Rol
            </th>
            <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">
              Creado
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const displayName = user.name || user.email;
            return (
              <tr key={user.id} className="text-zinc-200">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{displayName}</span>
                    {isSelf ? (
                      <Badge tone="emerald">Vos</Badge>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-300">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge tone={roleTone(user.role)}>{roleLabel(user.role)}</Badge>
                </td>
                <td className="hidden px-4 py-3 text-zinc-400 sm:table-cell">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/usuarios/${user.id}`}
                      className="text-sm font-medium text-indigo-300 hover:text-indigo-200"
                    >
                      Editar
                    </Link>
                    <DeleteUserButton
                      userId={user.id}
                      userLabel={displayName}
                      onDeleted={onDeleted}
                      disabled={isSelf}
                      disabledReason="No podés eliminar tu propio usuario"
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
