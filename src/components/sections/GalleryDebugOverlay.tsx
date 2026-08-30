"use client";

import { useEffect, useState } from "react";

/**
 * Temporary, on-device diagnostic panel — invisible by default, so it
 * doesn't affect normal visitors. Shows itself automatically the moment it
 * detects the gallery's images actually failed to load (or none exist in
 * the DOM at all), or if the page was loaded with `?debug=1` explicitly.
 * Auto-showing matters because iOS Safari's address bar routinely
 * autocompletes away query strings like `?debug=1` when you retype a
 * site you've visited before, making that flag unreliable to rely on
 * alone. Renders as plain visible text so it can be read straight off a
 * screenshot with no devtools needed. Safe to delete once the underlying
 * issue is found.
 */
function debugFlagRequested(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

export function GalleryDebugOverlay() {
  const [visible, setVisible] = useState(false);
  const [report, setReport] = useState<string>("collecting...");

  useEffect(() => {
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
      const failed = imgs.filter((img) => img.complete && img.naturalWidth === 0);

      const lines: string[] = [];
      lines.push(`UA: ${navigator.userAgent}`);
      lines.push(`href: ${window.location.href}`);
      lines.push(`viewport: ${window.innerWidth}x${window.innerHeight}`);
      lines.push(`#media found: ${Boolean(section)}`);
      lines.push(`img count in #media: ${imgs.length}, failed: ${failed.length}`);

      // getBoundingClientRect on an <img> reports its own box regardless of
      // whether an ancestor has collapsed to zero height and is clipping it
      // out via overflow — walk up from the first card to the section and
      // report every level's own rect, to catch that blind spot directly.
      let tinyAncestor = false;
      const firstButton = section?.querySelector("button");
      if (firstButton) {
        let el: HTMLElement | null = firstButton;
        let depth = 0;
        while (el && el !== section?.parentElement && depth < 6) {
          const r = el.getBoundingClientRect();
          if (r.height < 4 || r.width < 4) tinyAncestor = true;
          lines.push(
            `ancestor[${depth}] <${el.tagName.toLowerCase()} class="${el.className.toString().slice(0, 60)}"> rect=${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.x)},${Math.round(r.y)}`
          );
          el = el.parentElement;
          depth++;
        }
      }

      const hasFailure = imgs.length === 0 || failed.length > 0 || tinyAncestor;

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

      lines.push("serviceWorker: checking...");
      setReport(lines.join("\n"));

      if (debugFlagRequested() || hasFailure) {
        setVisible(true);
      }

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          setReport((prev) => prev.replace("serviceWorker: checking...", `serviceWorker: ${regs.length}`));
        });
      }
    }

    const t1 = setTimeout(collect, 1500);
    const t2 = setTimeout(collect, 4000);
    const t3 = setTimeout(collect, 8000);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (!visible) return null;

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
