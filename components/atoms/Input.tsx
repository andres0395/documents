import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, hasError, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border bg-zinc-900 px-3 text-sm text-zinc-100 placeholder-zinc-500",
        "transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950",
        hasError
          ? "border-red-500 focus:border-red-400 focus:ring-red-400"
          : "border-zinc-700 focus:border-indigo-400 focus:ring-indigo-400",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      aria-invalid={hasError ? true : undefined}
      {...rest}
    />
  );
});
