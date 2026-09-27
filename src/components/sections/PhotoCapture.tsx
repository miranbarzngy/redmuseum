"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, ScanFace } from "lucide-react";
import { FaceScanCapture } from "./FaceScanCapture";

// Photo step of the booking wizard: a "Scan your face" card opens the guided
// FaceScanCapture overlay, and the small JPEG it hands back is uploaded to
// the private face-scans bucket via /api/reserve/upload-face. The local
// data URL is shown immediately so the visitor never waits on the upload to
// see their photo.

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = /^data:([^;]+)/.exec(header)?.[1] ?? "image/jpeg";
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

type UploadState = "idle" | "uploading" | "error";

export function PhotoCapture({
  imageUrl,
  onCaptured,
  onReset,
  onUploadingChange,
}: {
  imageUrl: string | null;
  onCaptured: (result: { url: string; path: string }) => void;
  onReset: () => void;
  /** Lets the wizard hold its submit button until the photo has a storage path. */
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const t = useTranslations("booking.photoStep");
  const [scanOpen, setScanOpen] = useState(false);
  const [localPhoto, setLocalPhoto] = useState<string | null>(null);
  const [upload, setUploadState] = useState<UploadState>("idle");
  // Bumped per upload so a slow response for a replaced photo is ignored.
  const uploadIdRef = useRef(0);

  function setUpload(next: UploadState) {
    setUploadState(next);
    onUploadingChange?.(next === "uploading");
  }

  async function uploadPhoto(dataUrl: string) {
    const id = ++uploadIdRef.current;
    setUpload("uploading");
    try {
      const formData = new FormData();
      formData.append("face", dataUrlToBlob(dataUrl), "photo.jpg");

      const res = await fetch("/api/reserve/upload-face", { method: "POST", body: formData });
      const body = (await res.json().catch(() => null)) as { ok: boolean; url?: string; path?: string } | null;
      if (id !== uploadIdRef.current) return;

      if (!res.ok || !body?.ok || !body.url || !body.path) {
        setUpload("error");
        return;
      }
      onCaptured({ url: body.url, path: body.path });
      setUpload("idle");
    } catch (err) {
      if (id !== uploadIdRef.current) return;
      console.error("Photo upload failed:", err);
      setUpload("error");
    }
  }

  function handleCapture(dataUrl: string) {
    setScanOpen(false);
    // The previous photo (if any) is only dropped once a new one exists —
    // cancelling a "Change photo" scan keeps it.
    onReset();
    setLocalPhoto(dataUrl);
    void uploadPhoto(dataUrl);
  }

  const shown = localPhoto ?? imageUrl;
  const done = upload === "idle" && Boolean(imageUrl);

  return (
    <>
      {shown ? (
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Outer wrapper is NOT clipped so the check badge can sit on the
              circle's edge without the rounded-full mask cropping it. */}
          <div className="relative h-40 w-40 shrink-0">
            <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-[#c8a96e] shadow-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shown} alt="" className="h-full w-full object-cover" />
              {upload === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
                  <Loader2 size={26} className="animate-spin text-canvas" />
                </div>
              )}
            </div>
            {done && (
              <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                <Check size={16} strokeWidth={3} />
              </span>
            )}
          </div>

          {upload === "uploading" && <p className="text-fluid-sm text-ink-soft">{t("uploading")}</p>}
          {done && <p className="text-fluid-sm font-medium text-emerald-600">{t("captured")}</p>}
          {upload === "error" && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-fluid-xs text-pigment-crimson">{t("uploadFailed")}</p>
              {localPhoto && (
                <button
                  type="button"
                  onClick={() => void uploadPhoto(localPhoto)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#850B10] px-6 py-3 text-fluid-sm font-medium text-canvas shadow-card transition-transform hover:scale-[1.03] active:scale-95"
                >
                  {t("retry")}
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setScanOpen(true)}
            disabled={upload === "uploading"}
            className="text-fluid-xs font-medium text-ink-faint underline decoration-dotted underline-offset-4 transition-colors hover:text-[#850B10] disabled:opacity-50"
          >
            {t("changePhoto")}
          </button>
        </div>
      ) : (
        <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border border-[#c8a96e]/30 bg-canvas-soft/60 px-6 py-8 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#850B10]/10 text-[#850B10]">
            <ScanFace size={40} strokeWidth={1.5} />
          </span>
          <p className="max-w-[18rem] text-fluid-xs leading-relaxed text-ink-soft">{t("scanHint")}</p>
          <button
            type="button"
            onClick={() => setScanOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#850B10] px-7 py-3.5 text-fluid-sm font-medium text-canvas shadow-card transition-transform hover:scale-[1.03] active:scale-95"
          >
            <ScanFace size={18} />
            {t("scanCta")}
          </button>
        </div>
      )}

      {scanOpen && <FaceScanCapture onCapture={handleCapture} onCancel={() => setScanOpen(false)} />}
    </>
  );
}
