"use client";

import { useTransition } from "react";
import { updateBookingStatus } from "./actions";
import { STATUS_LABELS, STATUS_STYLES, STATUS_ORDER } from "./status";
import type { BookingStatus } from "@/lib/supabase/database.types";

export function StatusSelect({ id, status }: { id: string; status: BookingStatus }) {
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as BookingStatus;
    startTransition(() => {
      updateBookingStatus(id, next).catch(() => {
        // Best-effort — the select keeps showing the prior value on next
        // render if the update failed.
      });
    });
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={pending}
      onClick={(e) => e.stopPropagation()}
      className={`font-kurdish rounded-full border-0 px-3 py-1.5 text-fluid-xs font-medium outline-none disabled:opacity-60 ${STATUS_STYLES[status]}`}
    >
      {STATUS_ORDER.map((key) => (
        <option key={key} value={key}>
          {STATUS_LABELS[key]}
        </option>
      ))}
    </select>
  );
}
