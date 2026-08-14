"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/atoms/Input";
import { FormField } from "@/components/molecules/FormField";
import { SubmitButton } from "@/components/molecules/SubmitButton";
import { loginAction, type LoginActionState } from "@/actions/auth";

interface LoginFormProps {
  /** Path the user should land on after a successful login. */
  next: string;
}

const INITIAL_STATE: LoginActionState = { ok: false, message: "" };

export function LoginForm({ next }: LoginFormProps) {
  const [state, formAction] = useActionState(loginAction, INITIAL_STATE);

  // After a server error, the action echoes the email so the user doesn't
  // have to retype it. Default to "" for the very first render.
  const v = state.values;
  const emailValue = v?.email ?? "";

  // Force a remount when the action returns a new state so the input
  // picks up `defaultValue` from `state.values` after an error.
  const formKey = state === INITIAL_STATE ? "initial" : "state-login";

  return (
    <form
      key={formKey}
      action={formAction}
      className="flex w-full flex-col gap-4"
      aria-describedby={state.message ? "login-message" : undefined}
    >
      <input type="hidden" name="next" value={next} />

      {state.message && !state.ok ? (
        <div
          id="login-message"
          role="alert"
          className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
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
          defaultValue={emailValue}
          hasError={Boolean(state.fieldErrors?.email)}
          placeholder="tu@correo.com"
        />
      </FormField>

      <FormField
        id="password"
        label="Contraseña"
        required
        error={state.fieldErrors?.password}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          hasError={Boolean(state.fieldErrors?.password)}
          placeholder="••••••••"
        />
      </FormField>

      <SubmitButton label="Iniciar sesión" pendingLabel="Verificando…" />

      <p className="text-center text-xs text-zinc-500">
        ¿No tenés cuenta?{" "}
        <Link
          href="/login"
          className="text-indigo-300 underline underline-offset-2 hover:text-indigo-200"
        >
          Pedile al administrador que te cree una
        </Link>
        .
      </p>
    </form>
  );
}
