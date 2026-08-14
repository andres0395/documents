"use client";

import { useId, useRef, useState } from "react";
import { Label } from "@/components/atoms/Label";
import { cn } from "@/lib/cn";

interface FileUploadProps {
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  defaultFileName?: string;
  defaultFileUrl?: string | null;
  accept?: string;
}

const ACCEPT_HINT = "Imágenes (PNG, JPG, WEBP) o PDF. Máximo 10 MB.";

export function FileUpload({
  name,
  label,
  required,
  error,
  hint,
  defaultFileName,
  defaultFileUrl,
  accept = "application/pdf,image/png,image/jpeg,image/webp",
}: FileUploadProps) {
  const inputId = useId();
  const [fileName, setFileName] = useState<string | null>(
    defaultFileName ?? null,
  );
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? defaultFileName ?? null);
  };

  const handleClear = () => {
    if (inputRef.current) inputRef.current.value = "";
    setFileName(defaultFileName ?? null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={inputId} required={required}>
        {label}
      </Label>

      <div
        className={cn(
          "flex items-center gap-3 rounded-md border border-dashed bg-zinc-900/50 px-3 py-2.5",
          error
            ? "border-red-500"
            : "border-zinc-700 hover:border-zinc-600",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="block w-full text-sm text-zinc-300
            file:mr-3 file:rounded-md file:border-0
            file:bg-indigo-500 file:px-3 file:py-1.5
            file:text-sm file:font-medium file:text-white
            hover:file:bg-indigo-400 file:cursor-pointer
            focus-visible:outline-none"
        />
        {fileName ? (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Quitar archivo seleccionado"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : null}
      </div>

      {fileName && defaultFileUrl ? (
        <p className="text-xs text-zinc-400">
          Archivo actual:{" "}
          <a
            href={defaultFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-300 underline underline-offset-2 hover:text-indigo-200"
          >
            {fileName}
          </a>{" "}
          <span className="text-zinc-500">(sube uno nuevo para reemplazarlo)</span>
        </p>
      ) : null}

      {error ? (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-xs font-medium text-red-400"
        >
          {error}
        </p>
      ) : (
        <p className="text-xs text-zinc-500">
          {hint ?? ACCEPT_HINT}
        </p>
      )}
    </div>
  );
}
