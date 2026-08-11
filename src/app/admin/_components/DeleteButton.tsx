"use client";

import { Trash2 } from "lucide-react";

export function DeleteButton({
  action,
  confirmMessage,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        aria-label="سڕینەوە"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink-faint transition-colors hover:border-pigment-crimson hover:text-pigment-crimson"
      >
        <Trash2 size={15} />
      </button>
    </form>
  );
}
