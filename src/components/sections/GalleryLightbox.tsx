"use client";

import { useEffect, useState } from "react";
import type { GalleryImage } from "@/lib/data/gallery";

export function GalleryLightbox({
  images,
  startIdx,
  onClose,
}: {
  images: GalleryImage[];
  startIdx: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIdx);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [images.length, onClose]);

  const current = images[idx];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <span className="absolute top-6 left-1/2 -translate-x-1/2 font-mono text-sm text-white/80">
        {idx + 1} / {images.length}
      </span>

      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-[#c8a96e] hover:bg-[#7a0000]"
      >
        <i className="ri-close-line text-xl" />
      </button>

      <button
        type="button"
        aria-label="Previous"
        onClick={(e) => {
          e.stopPropagation();
          setIdx((i) => (i - 1 + images.length) % images.length);
        }}
        className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-[#c8a96e] hover:bg-[#7a0000] sm:left-8"
      >
        <i className="ri-arrow-left-s-line text-2xl" />
      </button>

      <button
        type="button"
        aria-label="Next"
        onClick={(e) => {
          e.stopPropagation();
          setIdx((i) => (i + 1) % images.length);
        }}
        className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-[#c8a96e] hover:bg-[#7a0000] sm:right-8"
      >
        <i className="ri-arrow-right-s-line text-2xl" />
      </button>

      <div
        className="flex max-w-[90vw] flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- lightbox needs the raw image sized by content, next/image's fixed layout modes don't fit here */}
        <img
          src={current.imageUrl}
          alt={current.title ?? ""}
          className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-[0_0_0_1px_#c8a96e,0_20px_60px_-15px_rgba(200,169,110,0.5)]"
        />
        {current.title && <p className="text-center text-sm text-white/80">{current.title}</p>}
      </div>

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {images.map((img, i) => (
          <span
            key={img.id}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-5 bg-[#c8a96e]" : "w-1.5 bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
