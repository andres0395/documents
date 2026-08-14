"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/atoms/Input";
import { FormField } from "@/components/molecules/FormField";
import { FileUpload } from "@/components/molecules/FileUpload";
import { SubmitButton } from "@/components/molecules/SubmitButton";
import {
  createCitaAction,
  updateCitaAction,
  type CitaActionState,
} from "@/actions/citas";
import { toDateInputValue } from "@/lib/date";

interface AppointmentFormProps {
  mode: "create" | "edit";
  citaId?: string;
  defaults?: {
    nombre: string;
    fecha: string | Date;
    hora: string;
    lugar: string;
    archivoNombre?: string | null;
    archivoUrl?: string | null;
  };
}

const INITIAL_STATE: CitaActionState = { ok: false, message: "" };

export function AppointmentForm({
  mode,
  citaId,
  defaults,
}: AppointmentFormProps) {
  const action = mode === "create" ? createCitaAction : updateCitaAction;
  const [state, formAction] = useActionState(action, INITIAL_STATE);

  const defaultFecha = defaults?.fecha
    ? toDateInputValue(defaults.fecha)
    : "";

  // After a server error, the action echoes the values the user just
  // submitted in `state.values`. We use them as the source of truth so the
  // form never silently "resets" back to the original defaults. Priority:
  //   1. state.values (just submitted by the user)
  //   2. defaults (initial values from the DB on edit / nothing on create)
  const v = state.values;
  const nombreValue = v?.nombre ?? defaults?.nombre ?? "";
  const fechaValue = v?.fecha ?? defaultFecha;
  const horaValue = v?.hora ?? defaults?.hora ?? "";
  const lugarValue = v?.lugar ?? defaults?.lugar ?? "";

  // Force a remount of the form whenever the action returns a new state so
  // the inputs pick up `defaultValue` from `state.values` on error. This
  // makes the "preserve user input on error" contract explicit instead of
  // relying on uncontrolled-input persistence (which works today but is
  // easy to break with a future refactor).
  const formKey = state === INITIAL_STATE ? "initial" : `state-${citaId ?? "new"}`;

  const submitLabel = mode === "create" ? "Crear cita" : "Guardar cambios";

  return (
    <form
      key={formKey}
      action={formAction}
      className="flex flex-col gap-5"
      aria-describedby={state.message ? "form-message" : undefined}
    >
      {mode === "edit" && citaId ? (
        <input type="hidden" name="id" value={citaId} />
      ) : null}

      {state.message && !state.ok ? (
        <div
          id="form-message"
          role="alert"
          className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {state.message}
        </div>
      ) : null}

      <FormField
        id="nombre"
        label="Nombre de la cita"
        required
        error={state.fieldErrors?.nombre}
      >
        <Input
          id="nombre"
          name="nombre"
          type="text"
          required
          maxLength={200}
          defaultValue={nombreValue}
          hasError={Boolean(state.fieldErrors?.nombre)}
          placeholder="Ej. Revisión médica anual"
        />
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          id="fecha"
          label="Fecha de la cita"
          required
          error={state.fieldErrors?.fecha}
        >
          <Input
            id="fecha"
            name="fecha"
            type="date"
            required
            defaultValue={fechaValue}
            hasError={Boolean(state.fieldErrors?.fecha)}
          />
        </FormField>

        <FormField
          id="hora"
          label="Hora de la cita"
          required
          error={state.fieldErrors?.hora}
        >
          <Input
            id="hora"
            name="hora"
            type="time"
            required
            defaultValue={horaValue}
            hasError={Boolean(state.fieldErrors?.hora)}
          />
        </FormField>
      </div>

      <FormField
        id="lugar"
        label="Lugar de la cita"
        required
        error={state.fieldErrors?.lugar}
      >
        <Input
          id="lugar"
          name="lugar"
          type="text"
          required
          maxLength={200}
          defaultValue={lugarValue}
          hasError={Boolean(state.fieldErrors?.lugar)}
          placeholder="Ej. Clínica del Norte, consultorio 402"
        />
      </FormField>

      <FileUpload
        name="archivo"
        label="Archivo adjunto (opcional)"
        error={state.fieldErrors?.archivo}
        defaultFileName={defaults?.archivoNombre ?? undefined}
        defaultFileUrl={defaults?.archivoUrl ?? null}
      />

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/citas"
          className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-4 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-700"
        >
          Cancelar
        </Link>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
