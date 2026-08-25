"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// face-api.js touches `window` and camera APIs, so this component is only
// ever mounted via next/dynamic with ssr:false (see BookingClient.tsx) —
// importing it eagerly here would break server rendering.
import * as faceapi from "face-api.js";

const MODEL_URL = "/models";
const MAX_DIMENSION = 480;
const JPEG_QUALITY = 0.78;

// Liveness check: face-api.js has no built-in anti-spoofing model, so we
// approximate it with a challenge-response blink check over a short window
// of the live video stream — a static photo or screen held up to the camera
// won't blink, a real person will. Kept from the previous descriptor-based
// flow: capturing an actual photo makes a real anti-spoofing gate more
// important, not less.
const LIVENESS_WINDOW_MS = 7000;
const LIVENESS_CALIBRATION_MS = 600;
const LIVENESS_SAMPLE_INTERVAL_MS = 30;
const LIVENESS_INPUT_SIZE = 224;
const BLINK_CLOSE_RATIO = 0.83;
const BLINK_REOPEN_RATIO = 0.85;

type Status =
  | "loading"
  | "models-ready"
  | "idle"
  | "checking-liveness"
  | "liveness-failed"
  | "uploading"
  | "upload-failed"
  | "verified"
  | "error";

const FaceScanIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 1.5,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 9V5.5A1.5 1.5 0 015.5 4H9" />
    <path d="M15 4h3.5A1.5 1.5 0 0120 5.5V9" />
    <path d="M4 15v3.5A1.5 1.5 0 005.5 20H9" />
    <path d="M20 15v3.5a1.5 1.5 0 01-1.5 1.5H15" />
    <path d="M9 10.5v.5" strokeWidth="2" />
    <path d="M15 10.5v.5" strokeWidth="2" />
    <path d="M12 10.5v2" />
    <path d="M9.5 14.5c.7.7 1.5 1.1 2.5 1.1s1.8-.4 2.5-1.1" />
  </svg>
);

function eyeAspectRatio(eye: faceapi.Point[]): number {
  const dist = (a: faceapi.Point, b: faceapi.Point) => Math.hypot(a.x - b.x, a.y - b.y);
  const vertical = dist(eye[1], eye[5]) + dist(eye[2], eye[4]);
  const horizontal = dist(eye[0], eye[3]);
  return horizontal === 0 ? 0 : vertical / (2 * horizontal);
}

/** Downscales to MAX_DIMENSION on the long edge and re-encodes as JPEG before upload. */
function compressFrame(video: HTMLVideoElement): Promise<Blob | null> {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", JPEG_QUALITY));
}

export function FaceScan({
  open,
  onOpenChange,
  verified,
  uploading,
  imageUrl,
  onUploadingChange,
  onCaptured,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verified: boolean;
  uploading: boolean;
  imageUrl: string | null;
  onUploadingChange: (uploading: boolean) => void;
  onCaptured: (result: { url: string; path: string }) => void;
  onReset: () => void;
}) {
  const t = useTranslations("booking.faceScan");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [shotPreview, setShotPreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        if (!cancelled) setStatus("models-ready");
      } catch (err) {
        console.error("Face scan model load failed:", err);
        if (!cancelled) setStatus("error");
      }
    }

    init();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setShotPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  // iOS Safari (and some other mobile browsers) only grant getUserMedia
  // when it's called directly from a user gesture — requesting it
  // automatically on mount gets silently denied there.
  async function handleStartScan() {
    onOpenChange(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus("idle");
    } catch (err) {
      console.error("Face scan camera request failed:", err);
      setStatus("error");
    }
  }

  async function runLivenessCheck(): Promise<boolean> {
    const video = videoRef.current;
    if (!video) return false;

    let baselineEar: number | null = null;
    let sawClosedEye = false;
    let blinkDetected = false;
    const start = Date.now();
    const calibrationDeadline = start + LIVENESS_CALIBRATION_MS;
    const deadline = start + LIVENESS_WINDOW_MS;

    while (Date.now() < deadline && !blinkDetected) {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: LIVENESS_INPUT_SIZE }))
        .withFaceLandmarks();

      if (detection) {
        const ear = (eyeAspectRatio(detection.landmarks.getLeftEye()) + eyeAspectRatio(detection.landmarks.getRightEye())) / 2;

        if (Date.now() < calibrationDeadline) {
          // Calibration window: just track the highest (most open) EAR seen
          // so a stray partial-blink frame at the very start can't lock in
          // an artificially low baseline that later blinks can't clear.
          baselineEar = baselineEar === null ? ear : Math.max(baselineEar, ear);
        } else if (baselineEar === null) {
          baselineEar = ear;
        } else if (!sawClosedEye && ear < baselineEar * BLINK_CLOSE_RATIO) {
          sawClosedEye = true;
        } else if (sawClosedEye && ear > baselineEar * BLINK_REOPEN_RATIO) {
          blinkDetected = true;
        } else if (!sawClosedEye && ear > baselineEar) {
          baselineEar = ear;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, LIVENESS_SAMPLE_INTERVAL_MS));
    }

    return blinkDetected;
  }

  async function handleCapture() {
    const video = videoRef.current;
    if (!video) return;

    // Shoot the still immediately so the visitor gets instant feedback that
    // the shutter fired, then verify liveness against the still-live stream
    // before committing to it — a spoofed photo/screen held up to the camera
    // can still be "shot", but it won't pass the blink check that follows.
    const blob = await compressFrame(video);
    if (!blob) {
      setStatus("error");
      return;
    }
    setShotPreview(URL.createObjectURL(blob));

    setStatus("checking-liveness");
    const isLive = await runLivenessCheck();
    if (!isLive) {
      setShotPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setStatus("liveness-failed");
      return;
    }

    setStatus("uploading");
    onUploadingChange(true);
    stopCamera();

    try {
      const formData = new FormData();
      formData.append("face", blob, "face.jpg");

      const res = await fetch("/api/reserve/upload-face", { method: "POST", body: formData });
      const body = (await res.json().catch(() => null)) as { ok: boolean; url?: string; path?: string } | null;

      if (!res.ok || !body?.ok || !body.url || !body.path) {
        setStatus("upload-failed");
        onUploadingChange(false);
        return;
      }

      onCaptured({ url: body.url, path: body.path });
      setStatus("verified");
      onUploadingChange(false);
    } catch (err) {
      console.error("Face scan upload failed:", err);
      setStatus("upload-failed");
      onUploadingChange(false);
    }
  }

  function handleRescan() {
    setShotPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    onReset();
    setStatus("models-ready");
    onOpenChange(false);
  }

  const glassCard = "rounded-2xl border border-[#c8a96e]/30 bg-white/90 p-4 shadow-lg backdrop-blur-md";

  if (verified && imageUrl) {
    return (
      <div className={glassCard}>
        <p className="mb-3 text-fluid-xs font-medium text-ink-soft">{t("label")}</p>
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[#c8a96e]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
          </div>
          <div className="flex-1">
            <p className="text-fluid-xs font-medium text-emerald-600">{t("captured")}</p>
          </div>
          <button
            type="button"
            onClick={handleRescan}
            className="rounded-full border border-[#7a0000]/30 px-4 py-2 text-fluid-xs font-medium text-[#7a0000] transition-colors hover:bg-[#7a0000]/5"
          >
            {t("rescan")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={glassCard}>
      <p className="mb-2 text-fluid-xs font-medium text-ink-soft">{t("label")}</p>

      {status === "error" && <p className="mb-2 text-fluid-xs text-pigment-crimson">{t("error")}</p>}
      {status === "loading" && <p className="mb-2 text-fluid-xs text-ink-faint">{t("loading")}</p>}
      {status === "checking-liveness" && <p className="mb-2 text-fluid-xs text-ink-faint">{t("checkingLiveness")}</p>}
      {status === "liveness-failed" && <p className="mb-2 text-fluid-xs text-pigment-crimson">{t("livenessFailed")}</p>}
      {status === "upload-failed" && <p className="mb-2 text-fluid-xs text-pigment-crimson">{t("uploadFailed")}</p>}

      {open && (
        <div className="relative mb-3 overflow-hidden rounded-lg">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="aspect-video w-full -scale-x-100 rounded-lg bg-ink"
          />

          {shotPreview && (status === "checking-liveness" || status === "uploading") && (
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shotPreview} alt="" className="h-full w-full -scale-x-100 object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-ink/30">
                <span className="rounded-full bg-black/60 px-3 py-1.5 text-fluid-xs font-medium text-white">
                  {status === "checking-liveness" ? t("checkingLiveness") : t("uploading")}
                </span>
              </div>
            </div>
          )}

          {(status === "idle" || status === "checking-liveness") && (
            <div className="pointer-events-none absolute inset-0">
              {/* corner brackets */}
              {(["tl", "tr", "bl", "br"] as const).map((pos) => (
                <div
                  key={pos}
                  className="absolute h-6 w-6"
                  style={{
                    top: pos.startsWith("t") ? 8 : undefined,
                    bottom: pos.startsWith("b") ? 8 : undefined,
                    left: pos.endsWith("l") ? 8 : undefined,
                    right: pos.endsWith("r") ? 8 : undefined,
                    borderTop: pos.startsWith("t") ? "3px solid #c8a96e" : undefined,
                    borderBottom: pos.startsWith("b") ? "3px solid #c8a96e" : undefined,
                    borderLeft: pos.endsWith("l") ? "3px solid #c8a96e" : undefined,
                    borderRight: pos.endsWith("r") ? "3px solid #c8a96e" : undefined,
                    borderRadius:
                      pos === "tl" ? "6px 0 0 0" : pos === "tr" ? "0 6px 0 0" : pos === "bl" ? "0 0 0 6px" : "0 0 6px 0",
                  }}
                />
              ))}

              {/* moving scan line */}
              <div
                className="absolute left-0 right-0 h-0.5"
                style={{
                  background: "linear-gradient(to right, transparent, rgba(200,169,110,0.9), transparent)",
                  animation:
                    status === "checking-liveness"
                      ? "faceScanLine 1.1s ease-in-out infinite"
                      : "faceScanLine 2.2s ease-in-out infinite",
                }}
              />
            </div>
          )}

          <style>{`
            @keyframes faceScanLine {
              0% { top: 6%; }
              50% { top: 92%; }
              100% { top: 6%; }
            }
          `}</style>
        </div>
      )}

      <div className="flex items-center gap-2">
        {!open ? (
          <button
            type="button"
            onClick={handleStartScan}
            disabled={status === "loading"}
            className="inline-flex items-center gap-2 rounded-full bg-[#7a0000] px-4 py-2 text-fluid-xs font-medium text-canvas transition-opacity disabled:opacity-50"
          >
            <FaceScanIcon size={16} color="currentColor" strokeWidth={2} />
            {t("startScan")}
          </button>
        ) : uploading || status === "uploading" ? (
          <span className="inline-flex items-center gap-2 text-fluid-xs text-ink-soft">
            <svg className="h-4 w-4 animate-spin text-[#7a0000]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            {t("uploading")}
          </span>
        ) : (
          <button
            type="button"
            onClick={handleCapture}
            disabled={status === "checking-liveness"}
            className="inline-flex items-center gap-2 rounded-full bg-[#7a0000] px-4 py-2 text-fluid-xs font-medium text-canvas transition-opacity disabled:opacity-50"
          >
            <FaceScanIcon size={16} color="currentColor" strokeWidth={2} />
            {status === "liveness-failed" || status === "upload-failed" ? t("retry") : t("capture")}
          </button>
        )}
      </div>
    </div>
  );
}
