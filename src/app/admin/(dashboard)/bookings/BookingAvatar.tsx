"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import clsx from "clsx";

export function bookingInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "؟";
}

/** Visitor avatar shared by the card and the details sheet — a pulsing gold
 * dot marks bookings still `pending` (gold = waiting on a decision, as on
 * the status pill), mirroring MessageAvatar's unread dot.
 * Shows the captured face photo (a short-lived signed URL, see
 * getFacePhotoUrl(s) in actions.ts) when one is passed in, falling back to
 * initials if there's none or the signed URL has expired/failed to load.
 * `shape="square"` fills its container edge-to-edge instead of the small
 * circle — used for the bookings grid card's big cover-photo panel, which
 * the caller sizes to an aspect-square box. When a photo is actually
 * showing there, an `onViewPhoto` callback adds a small eye button over the
 * corner to open it full-size, separate from the card's own onClick (which
 * opens the booking drawer). */
export function BookingAvatar({
  name,
  pending,
  photoUrl,
  size = "md",
  shape = "circle",
  onViewPhoto,
}: {
  name: string;
  pending: boolean;
  photoUrl?: string | null;
  size?: "md" | "lg";
  shape?: "circle" | "square";
  onViewPhoto?: () => void;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(photoUrl) && !photoFailed;
  const isSquare = shape === "square";

  return (
    <span className={clsx("relative block", isSquare ? "h-full w-full" : "shrink-0")}>
      <span
        className={clsx(
          "flex items-center justify-center overflow-hidden border border-ink/[0.06] bg-gradient-to-br from-canvas-paper to-[#EBE3D3] font-semibold text-brand",
          isSquare
            ? "h-full w-full rounded-xl text-fluid-xl"
            : clsx("rounded-full", size === "lg" ? "h-11 w-11 text-fluid-sm" : "h-9 w-9 text-fluid-xs")
        )}
      >
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl!}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          bookingInitials(name)
        )}
      </span>
      {isSquare && showPhoto && onViewPhoto && (
        <button
          type="button"
          aria-label="بینینی وێنە"
          onClick={(e) => {
            e.stopPropagation();
            onViewPhoto();
          }}
          className="absolute bottom-2 start-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/25 backdrop-blur-md transition-[background-color,transform] duration-200 ease-spring hover:bg-black/65 active:scale-90"
        >
          <Eye size={14} />
        </button>
      )}
      {pending && (
        <span
          aria-label="نوێ — پەسەند نەکراوە"
          className={clsx(
            "animate-glow-ring-gold absolute h-3 w-3 rounded-full bg-gold-fill ring-2 ring-white",
            isSquare ? "end-2 top-2" : "-end-0.5 -top-0.5"
          )}
        />
      )}
    </span>
  );
}
