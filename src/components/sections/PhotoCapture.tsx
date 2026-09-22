"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Camera, RotateCcw, Check, Loader2, AlertCircle } from "lucide-react";
import clsx from "clsx";
import { easeArt } from "@/lib/motionVariants";

// Camera-only capture step for the booking wizard. This intentionally does
// NOT run any face-api/liveness verification — that "scan" step proved
// unreliable for real visitors and was removed. This just takes a photo.

const MAX_DIMENSION = 640;
const JPEG_QUALITY = 0.82;
const MIN_QUALITY = 0.5;
// A plain-background face photo usually clears this on the first pass; busy
// frames fall through the quality/dimension retries below until they do.
const TARGET_BYTES = 150 * 1024;

function toJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality));
}

/** Downscales to `dimension` on the long edge and draws the current video
 * frame into a fresh canvas at that size. */
function drawFrame(video: HTMLVideoElement, dimension: number): HTMLCanvasElement | null {
  const scale = Math.min(1, dimension / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Re-encodes the captured frame as JPEG, aiming for TARGET_BYTES. Quality
 * is stepped down first (cheaper on perceived quality than losing
 * resolution); only once it hits MIN_QUALITY and is still too big does the
 * frame get redrawn smaller and the quality sweep retried. Three dimension
 * passes is a hard ceiling so a pathological frame can't loop forever —
 * whatever the last attempt produced is returned as a best effort. */
async function compressFrame(video: HTMLVideoElement): Promise<Blob | null> {
  let dimension = MAX_DIMENSION;
  let best: Blob | null = null;

  for (let pass = 0; pass < 3; pass++) {
    const canvas = drawFrame(video, dimension);
    if (!canvas) return null;

    for (let quality = JPEG_QUALITY; quality >= MIN_QUALITY - 1e-9; quality -= 0.08) {
      const blob = await toJpegBlob(canvas, quality);
      if (!blob) return best;
      best = blob;
      if (blob.size <= TARGET_BYTES) return blob;
    }

    dimension = Math.round(dimension * 0.75);
  }

  return best;
}

type CamState = "prestart" | "opening" | "live" | "preview" | "uploading" | "done" | "camera-error" | "upload-error";

export function PhotoCapture({
  imageUrl,
  onCaptured,
  onReset,
  onSkip,
}: {
  imageUrl: string | null;
  onCaptured: (result: { url: string; path: string }) => void;
  onReset: () => void;
  onSkip?: () => void;
}) {
  const t = useTranslations("booking.photoStep");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const shotBlobRef = useRef<Blob | null>(null);
  const [state, setState] = useState<CamState>(imageUrl ? "done" : "prestart");
  const [shot, setShot] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setShot((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  // iOS Safari only grants getUserMedia from a direct user gesture, so the
  // camera is never requested automatically — it needs this explicit tap.
  async function handleStart() {
    setState("opening");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        // iOS Safari ignores srcObject unless play() is explicitly awaited.
        await video.play().catch(() => {});
      }
      setState("live");
    } catch (err) {
      console.error("Photo capture camera request failed:", err);
      setState("camera-error");
    }
  }

  async function handleShoot() {
    const video = videoRef.current;
    if (!video) return;

    const blob = await compressFrame(video);
    if (!blob) return;

    shotBlobRef.current = blob;
    setShot((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
    setState("preview");
  }

  function handleRetake() {
    shotBlobRef.current = null;
    setShot((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setState("live");
  }

  async function handleUse() {
    const blob = shotBlobRef.current;
    if (!blob) return;

    setState("uploading");
    try {
      const formData = new FormData();
      formData.append("face", blob, "photo.jpg");

      const res = await fetch("/api/reserve/upload-face", { method: "POST", body: formData });
      const body = (await res.json().catch(() => null)) as { ok: boolean; url?: string; path?: string } | null;

      if (!res.ok || !body?.ok || !body.url || !body.path) {
        setState("upload-error");
        return;
      }

      stopCamera();
      onCaptured({ url: body.url, path: body.path });
      setState("done");
    } catch (err) {
      console.error("Photo upload failed:", err);
      setState("upload-error");
    }
  }

  function handleRescan() {
    stopCamera();
    shotBlobRef.current = null;
    setShot((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    onReset();
    setState("prestart");
  }

  if (state === "done" && imageUrl) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        {/* Outer wrapper is NOT clipped so the check badge can sit on the
            circle's edge without the rounded-full mask cropping it. */}
        <div className="relative h-40 w-40 shrink-0">
          <div className="h-full w-full overflow-hidden rounded-full border-4 border-[#c8a96e] shadow-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
          <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
            <Check size={16} strokeWidth={3} />
          </span>
        </div>
        <p className="text-fluid-sm font-medium text-emerald-600">{t("captured")}</p>
        <button
          type="button"
          onClick={handleRescan}
          className="text-fluid-xs font-medium text-ink-faint underline decoration-dotted underline-offset-4 transition-colors hover:text-[#850B10]"
        >
          {t("retake")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
        {/* Ambient ring — decorative, echoes the "scan" affordance without
            claiming to verify anything. */}
        <div
          className="absolute inset-0 rounded-full transition-colors duration-500"
          style={{
            border: "3px solid #c8a96e",
            boxShadow: "0 0 0 6px rgba(200,169,110,0.12), 0 0 40px rgba(200,169,110,0.18)",
          }}
        />

        <div className="absolute inset-[6px] overflow-hidden rounded-full bg-ink">
          {/* Always mounted (never conditionally rendered) so `videoRef` is
              already attached by the time handleStart's getUserMedia
              promise resolves — mounting it only once state flips to
              "live" left the ref null at the moment srcObject was set,
              which produced a black frame with no stream attached. */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={clsx(
              "h-full w-full -scale-x-100 object-cover",
              (state === "live" || state === "preview" || state === "uploading") ? "block" : "hidden"
            )}
          />

          <AnimatePresence>
            {shot && (state === "preview" || state === "uploading") && (
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                src={shot}
                alt=""
                className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
              />
            )}
          </AnimatePresence>

          {state === "live" && (
            <div className="pointer-events-none absolute inset-0">
              <div
                className="absolute left-0 right-0 h-0.5"
                style={{
                  background: "linear-gradient(to right, transparent, rgba(200,169,110,0.9), transparent)",
                  animation: "photoScanLine 2.4s ease-in-out infinite",
                }}
              />
            </div>
          )}

          {(state === "prestart" || state === "opening") && (
            <button
              type="button"
              onClick={handleStart}
              disabled={state === "opening"}
              className="flex h-full w-full flex-col items-center justify-center gap-3 text-gray-100 transition-colors hover:text-canvas disabled:opacity-70"
            >
              {state === "opening" ? (
                <Loader2 size={30} className="animate-spin" />
              ) : (
                <Camera size={30} />
              )}
              <span className="max-w-[10rem] text-fluid-xs font-medium leading-snug">
                {state === "opening" ? t("opening") : t("start")}
              </span>
            </button>
          )}

          {state === "camera-error" && (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center text-gray-100">
              <AlertCircle size={24} className="text-pigment-crimson" />
              <span className="text-fluid-xs leading-snug">{t("error")}</span>
              <button
                type="button"
                onClick={handleStart}
                className="mt-1 text-fluid-xs font-medium underline decoration-dotted underline-offset-4"
              >
                {t("retake")}
              </button>
            </div>
          )}

          {state === "uploading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
              <Loader2 size={26} className="animate-spin text-canvas" />
            </div>
          )}
        </div>

        <style>{`
          @keyframes photoScanLine {
            0% { top: 8%; }
            50% { top: 90%; }
            100% { top: 8%; }
          }
        `}</style>
      </div>

      {state === "upload-error" && (
        <p className="text-center text-fluid-xs text-pigment-crimson">{t("uploadFailed")}</p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {state === "live" && (
          <button
            type="button"
            onClick={handleShoot}
            className="inline-flex items-center gap-2 rounded-full bg-[#850B10] px-6 py-3 text-fluid-sm font-medium text-canvas shadow-card transition-transform hover:scale-[1.03] active:scale-95"
          >
            <Camera size={18} />
            {t("shoot")}
          </button>
        )}

        {(state === "preview" || state === "uploading") && (
          <>
            <button
              type="button"
              onClick={handleRetake}
              disabled={state === "uploading"}
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-fluid-sm font-medium text-ink-soft transition-colors hover:border-ink/30 disabled:opacity-50"
            >
              <RotateCcw size={16} />
              {t("retake")}
            </button>
            <button
              type="button"
              onClick={handleUse}
              disabled={state === "uploading"}
              className="inline-flex items-center gap-2 rounded-full bg-[#850B10] px-6 py-3 text-fluid-sm font-medium text-canvas shadow-card transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-60"
            >
              {state === "uploading" ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {state === "uploading" ? t("uploading") : t("confirmNext")}
            </button>
          </>
        )}

        {state === "upload-error" && (
          <button
            type="button"
            onClick={handleUse}
            className="inline-flex items-center gap-2 rounded-full bg-[#850B10] px-6 py-3 text-fluid-sm font-medium text-canvas shadow-card"
          >
            {t("confirmNext")}
          </button>
        )}
      </div>

      {onSkip && (state === "prestart" || state === "camera-error") && (
        <motion.button
          type="button"
          onClick={onSkip}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: easeArt, delay: 0.3 }}
          className="text-fluid-xs text-ink-faint underline decoration-dotted underline-offset-4 transition-colors hover:text-ink-soft"
        >
          {t("skip")}
        </motion.button>
      )}
    </div>
  );
}
