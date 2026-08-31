"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authService } from "@/services/auth";
import { createSessionToken } from "@/lib/auth/session";
import { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth/config";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El email es obligatorio")
    .email("Email inválido"),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria"),
});

const nextSchema = z
  .string()
  .regex(/^\/[^/]/, "next debe ser un path relativo")
  .max(512, "next demasiado largo")
  .optional()
  .or(z.literal("").transform(() => undefined));

export interface LoginActionState {
  ok: boolean;
  message: string;
  values?: { email: string };
  fieldErrors?: { email?: string; password?: string };
}

const INITIAL_STATE: LoginActionState = { ok: false, message: "" };

function fieldValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/**
 * Validates the submitted credentials, signs a session JWT, and sets it
 * as an HTTP-only cookie. On success, redirects to the post-login target
 * (defaults to /citas). Server Actions run in the Node.js runtime, so
 * `bcrypt` is available here even though the proxy runs in the Edge.
 */
export async function loginAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = fieldValue(formData, "email");
  const password = fieldValue(formData, "password");
  const nextRaw = fieldValue(formData, "next");

  const values = { email };
  const parsed = loginSchema.safeParse({ email, password });
  const parsedNext = nextSchema.safeParse(nextRaw);

  if (!parsed.success) {
    const fieldErrors: LoginActionState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "email" || key === "password") {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      ok: false,
      message: "Revisa los campos marcados",
      values,
      fieldErrors,
    };
  }

  const result = await authService.verifyCredentials(
    parsed.data.email,
    parsed.data.password,
  );

  if (!result.ok) {
    return { ok: false, message: result.error, values };
  }

  const token = await createSessionToken({
    userId: result.data.id,
    email: result.data.email,
    role: result.data.role,
  });

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  // next is optional; fall back to /dashboard (which then routes by
  // role). Only honor a relative path (validated by nextSchema) to
  // avoid open-redirect.
  const next =
    parsedNext.success && parsedNext.data ? parsedNext.data : "/dashboard";
  redirect(next);
}

/**
 * Clears the session cookie. Always redirects to /login.
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
