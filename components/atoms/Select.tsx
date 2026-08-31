import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  hasError?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

/**
 * Native <select> styled to match the Input atom. The chevron is
 * rendered with a sibling SVG so the control stays a real <select>
 * (keyboard / mobile / a11y friendly) without an extra wrapper.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, hasError, options, placeholder, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "h-10 w-full appearance-none rounded-md border bg-zinc-900 px-3 pr-9 text-sm text-zinc-100",
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
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
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
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </div>
  );
});
