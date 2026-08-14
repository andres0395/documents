import type { LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  children: ReactNode;
}

export function Label({ required, className, children, ...rest }: LabelProps) {
  return (
    <label
      className={cn(
        "text-sm font-medium text-zinc-200",
        "inline-flex items-center gap-1",
        className,
      )}
      {...rest}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className="text-red-400">
          *
        </span>
      ) : null}
    </label>
  );
}
