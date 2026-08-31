"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";

export function DeleteButton({
  action,
  confirmMessage,
  label = "سڕینەوە",
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        disabled={pending}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink-faint transition-colors hover:border-pigment-crimson hover:text-pigment-crimson disabled:opacity-50"
      >
        {pending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
      </button>
      <ConfirmDialog
        open={open}
        message={confirmMessage}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          startTransition(() => action());
        }}
      />
    </>
  );
}
