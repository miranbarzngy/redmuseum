"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * Renders a QR code for a same-origin path (e.g. "/ku/booking/<token>").
 * The absolute URL is resolved from `window.location.origin` at render
 * time so the same code works on localhost, preview deploys and
 * production without any configured base URL. Used on the booking
 * confirmation screen and the admin booking detail page.
 */
export function BookingQr({
  path,
  size = 208,
  className,
}: {
  path: string;
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const url = `${window.location.origin}${path}`;
    QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#1C1B19", light: "#ffffff" },
    })
      .then((dataUrl) => {
        if (active) setSrc(dataUrl);
      })
      .catch(() => {
        if (active) setSrc(null);
      });
    return () => {
      active = false;
    };
  }, [path, size]);

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      aria-hidden={!src}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="h-full w-full rounded-xl border border-ink/10 bg-white"
        />
      ) : (
        <div className="h-full w-full animate-pulse rounded-xl border border-ink/10 bg-ink/5" />
      )}
    </div>
  );
}
