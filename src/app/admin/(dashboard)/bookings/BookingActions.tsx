import clsx from "clsx";
import { Check, X, LogIn, CircleSlash, Eye, Printer, Loader2 } from "lucide-react";
import type { BookingRow } from "@/lib/supabase/database.types";

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
  /** Prints `label` underneath the circle — used for the pending row's
   * approve/reject buttons, which stay prominent enough to need a caption;
   * the secondary hover-group icons rely on the title tooltip instead. */
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
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50",
        tone === "emerald" && "bg-emerald-600 text-white hover:bg-emerald-700",
        tone === "rose" && "bg-rose-600 text-white hover:bg-rose-700",
        tone === "ghost" &&
          "border border-ink/10 bg-white text-ink-faint shadow-ring hover:border-pigment-terracotta/50 hover:text-pigment-terracotta"
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
 * Row/card action cluster shared by the table and the mobile card.
 * `pending` bookings get prominent, captioned approve/reject buttons.
 * Everything else (mark visited/no-show, print, view) lives in a smaller
 * secondary icon group, always visible on both the table row and the card.
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
    <div className="flex items-start gap-2">
      {isPending && (
        <>
          <ActionIcon
            label="پەسەندکردن"
            tone="emerald"
            showLabel
            disabled={busy}
            onClick={() => onRequestStatus("confirmed")}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2.75} />}
          </ActionIcon>
          <ActionIcon
            label="ڕەتکردنەوە"
            tone="rose"
            showLabel
            disabled={busy}
            onClick={() => onRequestStatus("cancelled")}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <X size={14} strokeWidth={2.75} />}
          </ActionIcon>
        </>
      )}

      <div className="flex items-center gap-1.5 pt-1">
        {isConfirmed && (
          <>
            <ActionIcon label="دیاریکردن وەک هاتوو" disabled={busy} onClick={() => onRequestStatus("checked_in")}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : <LogIn size={13} />}
            </ActionIcon>
            <ActionIcon label="دیاریکردن وەک نەهاتوو" disabled={busy} onClick={() => onRequestStatus("no_show")}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : <CircleSlash size={13} />}
            </ActionIcon>
          </>
        )}
        <ActionIcon label="چاپکردن" onClick={onPrint}>
          <Printer size={13} />
        </ActionIcon>
        <ActionIcon label="بینین" onClick={onView}>
          <Eye size={13} />
        </ActionIcon>
      </div>
    </div>
  );
}
