"use client";

import { useTransition } from "react";
import { updateBookingStatus } from "./actions";
import type { BookingStatus } from "@/lib/supabase/database.types";

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "چاوەڕوان",
  confirmed: "پشتڕاستکراوە",
  checked_in: "هاتووە",
  cancelled: "هەڵوەشێنراوەتەوە",
  no_show: "نەهاتووە",
};

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-pigment-gold/15 text-[#8a6d1f]",
  confirmed: "bg-pigment-teal/15 text-pigment-teal",
  checked_in: "bg-ink/10 text-ink",
  cancelled: "bg-pigment-crimson/10 text-pigment-crimson",
  no_show: "bg-ink/5 text-ink-faint",
};

export function StatusSelect({ id, status }: { id: string; status: BookingStatus }) {
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as BookingStatus;
    startTransition(() => {
      updateBookingStatus(id, next).catch(() => {
        // Best-effort — the select will simply keep showing the prior value
        // on next render if the update failed.
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
      {(Object.keys(STATUS_LABELS) as BookingStatus[]).map((key) => (
        <option key={key} value={key}>
          {STATUS_LABELS[key]}
        </option>
      ))}
    </select>
  );
}

export { STATUS_LABELS };
