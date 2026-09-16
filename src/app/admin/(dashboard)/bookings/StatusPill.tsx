import clsx from "clsx";
import { STATUS_LABELS, STATUS_PILL, STATUS_DOT } from "./status";
import type { BookingStatus } from "@/lib/supabase/database.types";

/** Soft-coloured pill with a dot indicator — the compact status marker used
 * in the table, the mobile card, and the drawer header. */
export function StatusPill({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span
      className={clsx(
        "font-kurdish inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-fluid-xs font-medium",
        STATUS_PILL[status],
        className
      )}
    >
      <span className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}
