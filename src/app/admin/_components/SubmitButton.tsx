"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import clsx from "clsx";
import { btnPrimary } from "./Button";

export function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={clsx(btnPrimary, "px-6", className)}>
      {pending && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
