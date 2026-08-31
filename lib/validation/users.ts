import { z } from "zod";
import { isRoleName } from "@/types/user";

const roleSchema = z
  .string()
  .refine(isRoleName, { message: "Rol inválido" })
  .transform((v) => v as "admin" | "editor");

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(128, "La contraseña es demasiado larga");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "El email es obligatorio")
  .email("Email inválido")
  .max(200, "El email es demasiado largo");

export const createUserSchema = z
  .object({
    email: emailSchema,
    name: z
      .string()
      .trim()
      .max(120, "El nombre es demasiado largo")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    role: roleSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    email: emailSchema,
    name: z
      .string()
      .trim()
      .max(120, "El nombre es demasiado largo")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    role: roleSchema,
    password: z
      .string()
      .max(128, "La contraseña es demasiado larga")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    confirmPassword: z
      .string()
      .max(128, "La contraseña es demasiado larga")
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .refine(
    (data) => {
      // Either both password fields empty, or both filled and equal.
      const hasAny = Boolean(data.password || data.confirmPassword);
      if (!hasAny) return true;
      return data.password === data.confirmPassword;
    },
    {
      message: "Las contraseñas no coinciden",
      path: ["confirmPassword"],
    },
  );

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const listUsersQuerySchema = z.object({
  filters: z
    .object({
      nombre: z.string().trim().max(120).optional(),
      email: z.string().trim().max(200).optional(),
      role: z.string().refine(isRoleName).optional(),
    })
    .optional(),
  offset: z.number().int().min(0).max(1000),
  limit: z.number().int().min(1).max(50),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
