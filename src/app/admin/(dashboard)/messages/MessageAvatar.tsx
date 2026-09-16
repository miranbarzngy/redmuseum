import clsx from "clsx";

export function messageInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "؟";
}

/** Sender avatar shared by MessageCard and MessageDrawer: filled emerald
 * with a glowing unread dot for unread messages, muted paper tone once
 * read — emerald matches the message accent used across the admin
 * (NotificationModal's message cards, this inbox's unread tint). */
export function MessageAvatar({
  name,
  unread,
  size = "md",
}: {
  name: string;
  unread: boolean;
  size?: "md" | "lg";
}) {
  return (
    <span className="relative shrink-0">
      <span
        className={clsx(
          "flex items-center justify-center rounded-full font-semibold",
          size === "lg" ? "h-11 w-11 text-fluid-sm" : "h-10 w-10 text-fluid-xs",
          unread ? "bg-emerald-600 text-white" : "bg-canvas-paper text-ink-soft",
        )}
      >
        {messageInitials(name)}
      </span>
      {unread && (
        <span
          aria-label="نەخوێندراوە"
          className="absolute -end-0.5 -top-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"
        />
      )}
    </span>
  );
}
