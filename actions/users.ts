"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-session";
import { userService } from "@/services/users";
import {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
} from "@/lib/validation/users";
import {
  isRoleName,
  toUserPublic,
  type UserPublic,
} from "@/types/user";
import { CITAS_REVALIDATE_TAG } from "@/lib/constants";
import { revalidateTag } from "next/cache";

export interface UserFormState {
  ok: boolean;
  message: string;
  values?: {
    email: string;
    name: string;
    role: string;
  };
  fieldErrors?: Partial<Record<"email" | "name" | "role" | "password" | "confirmPassword", string>>;
  userId?: string;
}

const EMPTY_VALUES = { email: "", name: "", role: "editor" as const };

function fieldValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function flattenZodErrors(
  error: import("zod").ZodError,
): UserFormState["fieldErrors"] {
  const fieldErrors: UserFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const path = issue.path[0];
    if (typeof path !== "string") continue;
    if (!fieldErrors[path as keyof NonNullable<UserFormState["fieldErrors"]>]) {
      (fieldErrors as Record<string, string>)[path] = issue.message;
    }
  }
  return fieldErrors;
}

function readValues(formData: FormData) {
  return {
    email: fieldValue(formData, "email"),
    name: fieldValue(formData, "name"),
    role: fieldValue(formData, "role"),
  };
}

export async function createUserAction(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireRole("admin");
  const values = readValues(formData);
  const parsed = createUserSchema.safeParse({
    email: values.email,
    name: values.name,
    role: values.role,
    password: fieldValue(formData, "password"),
    confirmPassword: fieldValue(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los campos marcados",
      values,
      fieldErrors: flattenZodErrors(parsed.error),
    };
  }

  const result = await userService.create({
    email: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role,
    password: parsed.data.password,
  });
  if (!result.ok) {
    return { ok: false, message: result.error, values };
  }

  revalidatePath("/admin/usuarios");
  revalidateTag(CITAS_REVALIDATE_TAG, "max");
  return { ok: true, message: "Usuario creado", userId: result.data.id };
}

export async function updateUserAction(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await requireRole("admin");
  const id = fieldValue(formData, "id");
  if (!id) {
    return { ok: false, message: "Falta el identificador del usuario", values: EMPTY_VALUES };
  }

  const values = readValues(formData);
  const parsed = updateUserSchema.safeParse({
    email: values.email,
    name: values.name,
    role: values.role,
    password: fieldValue(formData, "password"),
    confirmPassword: fieldValue(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los campos marcados",
      values,
      fieldErrors: flattenZodErrors(parsed.error),
    };
  }

  const result = await userService.update({
    id,
    email: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role,
    password: parsed.data.password || undefined,
  });
  if (!result.ok) {
    return { ok: false, message: result.error, values };
  }

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${id}`);
  revalidateTag(CITAS_REVALIDATE_TAG, "max");

  // If the admin edited their own role/email, their session is now
  // stale (different role/email). Force a fresh login so the UI
  // reflects the change immediately. This is the only case where we
  // bypass the guard intentionally.
  if (id === session.userId) {
    const { cookies } = await import("next/headers");
    const { SESSION_COOKIE_NAME } = await import("@/lib/auth/config");
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return { ok: true, message: "Sesión actualizada — volvé a iniciar sesión", userId: id };
  }

  return { ok: true, message: "Usuario actualizado", userId: result.data.id };
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const session = await requireRole("admin");
  const id = fieldValue(formData, "id");
  if (!id) return;

  const result = await userService.delete(id, session.userId);
  if (!result.ok) {
    // Throw to surface the error to the global boundary; the
    // user-list has UI checks that should prevent this in practice.
    throw new Error(result.error);
  }
  revalidatePath("/admin/usuarios");
  revalidateTag(CITAS_REVALIDATE_TAG, "max");
}

export interface ListUsersResult {
  data: UserPublic[];
  total: number;
}

export async function listUsersAction(input: unknown): Promise<ListUsersResult> {
  await requireRole("admin");
  const parsed = listUsersQuerySchema.safeParse(input);
  if (!parsed.success) {
    return { data: [], total: 0 };
  }
  const { filters = {}, offset, limit } = parsed.data;
  const page = await userService.listPaginated(
    {
      nombre: filters.nombre,
      email: filters.email,
      role: filters.role && isRoleName(filters.role) ? filters.role : undefined,
    },
    offset,
    limit,
  );
  return {
    data: page.data.map(toUserPublic),
    total: page.total,
  };
}
