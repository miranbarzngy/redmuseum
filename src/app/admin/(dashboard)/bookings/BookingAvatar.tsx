import clsx from "clsx";

export function bookingInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "؟";
}

/** Visitor avatar shared by the table, card, and drawer — a glowing red dot
 * marks bookings still `pending`, mirroring MessageAvatar's unread dot. */
export function BookingAvatar({
  name,
  pending,
  size = "md",
}: {
  name: string;
  pending: boolean;
  size?: "md" | "lg";
}) {
  return (
    <span className="relative shrink-0">
      <span
        className={clsx(
          "flex items-center justify-center rounded-full bg-canvas-paper font-semibold text-ink-soft",
          size === "lg" ? "h-11 w-11 text-fluid-sm" : "h-9 w-9 text-fluid-xs"
        )}
      >
        {bookingInitials(name)}
      </span>
      {pending && (
        <span
          aria-label="نوێ — پەسەند نەکراوە"
          className="animate-glow-ring absolute -end-0.5 -top-0.5 h-3 w-3 rounded-full bg-[#850B10] ring-2 ring-white"
        />
      )}
    </span>
  );
}
