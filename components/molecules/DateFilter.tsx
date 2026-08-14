"use client";

import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { cn } from "@/lib/cn";

interface DateFilterProps {
  label?: string;
  /** "YYYY-MM-DD" or "" for no filter. */
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
}

/**
 * Generic controlled date input for filters. Fires on every change
 * (no debounce) because date picks are discrete events.
 */
export function DateFilter({
  label,
  value,
  onChange,
  className,
  required,
}: DateFilterProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? <Label required={required}>{label}</Label> : null}
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
