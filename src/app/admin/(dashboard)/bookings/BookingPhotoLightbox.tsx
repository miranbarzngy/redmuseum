"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/** Full-size view of a booking's captured face photo, opened from the grid
 * card's eye button (BookingAvatar's onViewPhoto) — a plain image overlay,
 * simpler than GalleryLightbox since there's only ever one photo to show. */
export function BookingPhotoLightbox({
  url,
  name,
  onClose,
}: {
  url: string;
  name: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="داخستن"
        className="absolute end-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-pigment-terracotta hover:bg-white/10"
      >
        <X size={18} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element -- lightbox needs the raw image sized by content */}
      <img
        src={url}
        alt={name}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
      />
    </div>
  );
}
