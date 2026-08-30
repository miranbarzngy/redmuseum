"use client";

import { useEffect, useState } from "react";

/**
 * Temporary, on-device diagnostic panel — only renders when the page URL
 * has `?debug=1`, so it's invisible to normal visitors. Added specifically
 * to get real information off a phone that has no attachable devtools:
 * the browser's own identity, how many gallery <img> elements actually
 * exist and what state each one is really in, and any uncaught JS errors —
 * all rendered as plain visible text so it can be read straight off a
 * screenshot. Safe to delete once the underlying issue is found.
 */
function isEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

export function GalleryDebugOverlay() {
  const [enabled] = useState(isEnabled);
  const [report, setReport] = useState<string>("collecting...");

  useEffect(() => {
    if (!enabled) return;

    const errors: string[] = [];
    function onError(e: ErrorEvent) {
      errors.push(`[error] ${e.message}`);
    }
    function onRejection(e: PromiseRejectionEvent) {
      errors.push(`[rejection] ${String(e.reason)}`);
    }
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    function collect() {
      const section = document.getElementById("media");
      const imgs = section ? Array.from(section.querySelectorAll("img")) : [];
      const swCount = "serviceWorker" in navigator ? "checking..." : "unsupported";

      const lines: string[] = [];
      lines.push(`UA: ${navigator.userAgent}`);
      lines.push(`viewport: ${window.innerWidth}x${window.innerHeight}`);
      lines.push(`#media found: ${Boolean(section)}`);
      lines.push(`img count in #media: ${imgs.length}`);

      imgs.slice(0, 4).forEach((img, i) => {
        const r = img.getBoundingClientRect();
        lines.push(
          `img[${i}] src=${img.currentSrc || img.src} complete=${img.complete} natural=${img.naturalWidth}x${img.naturalHeight} rect=${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.x)},${Math.round(r.y)}`
        );
      });

      if (errors.length > 0) {
        lines.push("--- errors ---");
        lines.push(...errors);
      }

      lines.push(`serviceWorker: ${swCount}`);
      setReport(lines.join("\n"));

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          setReport((prev) => prev.replace("checking...", String(regs.length)));
        });
      }
    }

    const t1 = setTimeout(collect, 1500);
    const t2 = setTimeout(collect, 4000);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <pre
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999999,
        maxHeight: "50vh",
        overflow: "auto",
        margin: 0,
        padding: "10px",
        background: "rgba(0,0,0,0.9)",
        color: "#0f0",
        fontSize: "10px",
        lineHeight: 1.4,
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
      }}
    >
      {report}
    </pre>
  );
}
