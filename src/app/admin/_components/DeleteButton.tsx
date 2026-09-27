"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { Trash2, Loader2 } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";
import { iconBtnDanger } from "./Button";

/** `showLabel` prints the label underneath the circle — see the matching
 * note on EditLink. */
export function DeleteButton({
  action,
  confirmMessage,
  label = "سڕینەوە",
  showLabel,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label?: string;
  showLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <span className={clsx("inline-flex flex-col items-center", showLabel && "gap-1")}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={label}
          disabled={pending}
          className={clsx(iconBtnDanger, "h-11 w-11")}
        >
          {pending ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
        </button>
        {showLabel && (
          <span className="whitespace-nowrap font-kurdish text-[11px] text-ink-soft">{label}</span>
        )}
      </span>
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
