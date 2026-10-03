"use client";

import { useTransition } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { updateBookingStatus } from "./actions";
import { STATUS_LABELS, STATUS_ORDER, STATUS_PILL } from "./status";
import type { BookingStatus } from "@/lib/supabase/database.types";

/**
 * The details sheet's status control, styled as the same pill the cards
 * show. Kept a real <select>: on phones it opens the system's own picker,
 * which is as native as it gets, so only the pill itself animates — a
 * springy press and colour change; the options are drawn by the OS.
 */
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
    <span className="relative inline-flex w-fit">
      <select
        value={status}
        onChange={handleChange}
        disabled={pending}
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          "font-kurdish cursor-pointer appearance-none rounded-full border-0 py-1.5 pe-8 ps-3 text-fluid-xs font-medium outline-none transition-[background-color,color,box-shadow,transform] duration-300 ease-spring focus-visible:ring-2 focus-visible:ring-brand/30 active:scale-95 disabled:opacity-60",
          STATUS_PILL[status]
        )}
      >
        {/* Explicit colours: desktop Chrome draws the open list in the
            select's own colours, which would be white-on-white for the
            filled (gold / red) states. */}
        {STATUS_ORDER.map((key) => (
          <option key={key} value={key} className="bg-white text-ink">
            {STATUS_LABELS[key]}
          </option>
        ))}
      </select>
      <ChevronDown size={14} aria-hidden className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2" />
    </span>
  );
}
