"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { cn } from "@/lib/cn";

interface SearchInputProps {
  /** Visible label rendered above the input. */
  label?: string;
  placeholder?: string;
  /** Initial value for the input (uncontrolled). */
  defaultValue?: string;
  /**
   * Called after `debounceMs` of inactivity. The parent should treat
   * this as the "stable" filter value and trigger the server request.
   */
  onDebouncedChange: (value: string) => void;
  /** Debounce delay in ms. Defaults to 400. */
  debounceMs?: number;
  className?: string;
  inputClassName?: string;
}

/**
 * Generic text filter input with built-in debounce. The input is
 * uncontrolled for snappy typing; the parent only sees the value after
 * the user stops typing for `debounceMs` ms.
 */
export function SearchInput({
  label,
  placeholder,
  defaultValue = "",
  onDebouncedChange,
  debounceMs = 400,
  className,
  inputClassName,
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stash the latest callback in a ref so we can call the freshest version
  // when the timer fires without having to reset the timer on every
  // re-render.
  const callbackRef = useRef(onDebouncedChange);
  useEffect(() => {
    callbackRef.current = onDebouncedChange;
  }, [onDebouncedChange]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setValue(next);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callbackRef.current(next);
      }, debounceMs);
    },
    [debounceMs],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? <Label>{label}</Label> : null}
      <div className="relative">
        <Input
          type="search"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn("pl-9", inputClassName)}
        />
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          aria-hidden="true"
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
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
      </div>
    </div>
  );
}
