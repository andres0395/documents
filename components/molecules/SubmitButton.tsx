"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/atoms/Button";

interface SubmitButtonProps {
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  fullWidth?: boolean;
}

export function SubmitButton({
  label,
  pendingLabel = "Guardando…",
  variant = "primary",
  fullWidth,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending}
      fullWidth={fullWidth}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
