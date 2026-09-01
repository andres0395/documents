"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { FormField } from "@/components/molecules/FormField";
import { SubmitButton } from "@/components/molecules/SubmitButton";
import {
  createUserAction,
  updateUserAction,
  type UserFormState,
} from "@/actions/users";
import { ROLES, type RoleName } from "@/types/user";

interface UserFormProps {
  mode: "create" | "edit";
  userId?: string;
  defaults?: {
    email: string;
    name: string | null;
    role: RoleName;
  };
  sessionId: string;
}

const INITIAL_STATE: UserFormState = { ok: false, message: "" };

const ROLE_OPTIONS = ROLES.map((r) => ({ value: r.value, label: r.label }));

export function UserForm({ mode, userId, defaults, sessionId }: UserFormProps) {
  const action = mode === "create" ? createUserAction : updateUserAction;
  const [state, formAction] = useActionState(action, INITIAL_STATE);

  const v = state.values;
  const emailValue = v?.email ?? defaults?.email ?? "";
  const nameValue = v?.name ?? defaults?.name ?? "";
  const roleValue = (v?.role as RoleName) ?? defaults?.role ?? "editor";

  const submitLabel = mode === "create" ? "Crear usuario" : "Guardar cambios";
  const formKey = state === INITIAL_STATE ? "initial" : `state-${userId ?? "new"}`;

  const isEditingSelf = mode === "edit" && userId === sessionId ? true : false; // server also enforces

  return (
    <form
      key={formKey}
      action={formAction}
      className="flex flex-col gap-5"
      aria-describedby={state.message ? "form-message" : undefined}
    >
      {mode === "edit" && userId ? (
        <input type="hidden" name="id" value={userId} />
      ) : null}

      {state.message ? (
        <div
          id="form-message"
          role="alert"
          className={
            state.ok
              ? "rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
              : "rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
          }
        >
          {state.message}
        </div>
      ) : null}

      <FormField
        id="email"
        label="Email"
        required
        error={state.fieldErrors?.email}
      >
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={200}
          defaultValue={emailValue}
          hasError={Boolean(state.fieldErrors?.email)}
          placeholder="usuario@correo.com"
        />
      </FormField>

      <FormField
        id="name"
        label="Nombre"
        error={state.fieldErrors?.name}
        hint="Opcional, sólo para mostrar en la UI"
      >
        <Input
          id="name"
          name="name"
          type="text"
          maxLength={120}
          defaultValue={nameValue}
          hasError={Boolean(state.fieldErrors?.name)}
          placeholder="Nombre y apellido"
        />
      </FormField>

      <FormField
        id="role"
        label="Rol"
        required
        error={state.fieldErrors?.role}
        hint="Los administradores pueden gestionar usuarios"
      >
        <Select
          id="role"
          name="role"
          required
          defaultValue={roleValue}
          hasError={Boolean(state.fieldErrors?.role)}
          options={ROLE_OPTIONS}
        />
      </FormField>

      <fieldset className="rounded-md border border-zinc-800 p-4">
        <legend className="px-2 text-xs uppercase tracking-wide text-zinc-500">
          {mode === "create" ? "Contraseña" : "Cambiar contraseña (opcional)"}
        </legend>
        <div className="flex flex-col gap-4">
          <FormField
            id="password"
            label={mode === "create" ? "Contraseña" : "Nueva contraseña"}
            required={mode === "create"}
            error={state.fieldErrors?.password}
            hint={mode === "edit" ? "Dejá ambos campos vacíos para mantener la actual" : undefined}
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "create" ? "new-password" : "new-password"}
              required={mode === "create"}
              minLength={mode === "create" ? 8 : undefined}
              maxLength={128}
              hasError={Boolean(state.fieldErrors?.password)}
              placeholder="Mínimo 8 caracteres"
            />
          </FormField>
          <FormField
            id="confirmPassword"
            label="Confirmar contraseña"
            required={mode === "create"}
            error={state.fieldErrors?.confirmPassword}
          >
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required={mode === "create"}
              maxLength={128}
              hasError={Boolean(state.fieldErrors?.confirmPassword)}
            />
          </FormField>
        </div>
      </fieldset>

      {isEditingSelf ? (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Estás editando tu propio usuario. Si cambiás tu rol a Editor, perderás
          acceso a la gestión de usuarios inmediatamente al guardar.
        </p>
      ) : null}

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/admin/usuarios"
          className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-4 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-700"
        >
          Cancelar
        </Link>
        <SubmitButton label={submitLabel} />
      </div>

      {mode === "edit" ? (
        <p className="text-center text-xs text-zinc-500">
          ¿Necesitás eliminarlo? Usá el botón Eliminar en la lista.
        </p>
      ) : null}
    </form>
  );
}
