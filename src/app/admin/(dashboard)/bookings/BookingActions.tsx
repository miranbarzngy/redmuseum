import clsx from "clsx";
import { Check, X, LogIn, CircleSlash, Eye, Printer, Loader2 } from "lucide-react";
import type { BookingRow } from "@/lib/supabase/database.types";
import { iconBtn } from "../../_components/Button";

export type TargetStatus = "confirmed" | "cancelled" | "checked_in" | "no_show";

function ActionIcon({
  label,
  onClick,
  disabled,
  tone = "ghost",
  showLabel,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "ghost" | "emerald" | "rose";
  /** Prints `label` underneath the circle. */
  showLabel?: boolean;
  children: React.ReactNode;
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={clsx(
        "h-10 w-10",
        tone === "ghost"
          ? iconBtn
          : clsx(
              "flex shrink-0 items-center justify-center rounded-full text-white transition-[background-color,transform] duration-150 active:scale-90 disabled:opacity-50",
              tone === "emerald" && "bg-emerald-600 hover:bg-emerald-700",
              tone === "rose" && "bg-rose-600 hover:bg-rose-700"
            )
      )}
    >
      {children}
    </button>
  );

  if (!showLabel) return button;

  return (
    <span className="inline-flex flex-col items-center gap-1">
      {button}
      <span className="whitespace-nowrap font-kurdish text-[10px] font-medium leading-none text-ink-soft">
        {label}
      </span>
    </span>
  );
}

/**
 * Booking card's action cluster. `pending` bookings get prominent
 * emerald/rose approve/reject buttons on the trailing (right, RTL) edge;
 * the secondary group (mark visited/no-show, print, view) is pinned to the
 * opposite (left) edge via `ms-auto`, always visible on the card.
 */
export function BookingActions({
  booking,
  busy,
  onRequestStatus,
  onView,
  onPrint,
}: {
  booking: BookingRow;
  busy: boolean;
  onRequestStatus: (status: TargetStatus) => void;
  onView: () => void;
  onPrint: () => void;
}) {
  const isPending = booking.status === "pending";
  const isConfirmed = booking.status === "confirmed";

  return (
    <div className="flex flex-wrap items-start gap-2">
      {isPending && (
        <>
          <ActionIcon
            label="پەسەندکردن"
            tone="emerald"
            showLabel
            disabled={busy}
            onClick={() => onRequestStatus("confirmed")}
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={2.75} />}
          </ActionIcon>
          <ActionIcon
            label="ڕەتکردنەوە"
            tone="rose"
            showLabel
            disabled={busy}
            onClick={() => onRequestStatus("cancelled")}
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <X size={16} strokeWidth={2.75} />}
          </ActionIcon>
        </>
      )}

      <div className="ms-auto flex flex-wrap items-start gap-2">
        {isConfirmed && (
          <>
            <ActionIcon
              label="دیاریکردن وەک هاتوو"
              showLabel
              disabled={busy}
              onClick={() => onRequestStatus("checked_in")}
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
            </ActionIcon>
            <ActionIcon
              label="دیاریکردن وەک نەهاتوو"
              showLabel
              disabled={busy}
              onClick={() => onRequestStatus("no_show")}
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <CircleSlash size={15} />}
            </ActionIcon>
          </>
        )}
        <ActionIcon label="چاپکردن" showLabel onClick={onPrint}>
          <Printer size={15} />
        </ActionIcon>
        <ActionIcon label="بینین" showLabel onClick={onView}>
          <Eye size={15} />
        </ActionIcon>
      </div>
    </div>
  );
}
