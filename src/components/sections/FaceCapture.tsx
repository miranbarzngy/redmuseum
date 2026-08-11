"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// face-api.js touches `window` and camera APIs, so this component is only
// ever mounted via next/dynamic with ssr:false (see BookingClient.tsx) —
// importing it eagerly here would break server rendering.
import * as faceapi from "face-api.js";

const MODEL_URL = "/models";

type Status = "loading" | "idle" | "scanning" | "captured" | "error";

export function FaceCapture({ onCapture }: { onCapture: (descriptor: number[] | null) => void }) {
  const t = useTranslations("booking.faceScan");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setReady(true);
        setStatus("idle");
      } catch (err) {
        console.error("Face scan init failed:", err);
        if (!cancelled) setStatus("error");
      }
    }

    init();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function handleCapture() {
    if (!videoRef.current) return;
    setStatus("scanning");

    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setStatus("idle");
      return;
    }

    onCapture(Array.from(detection.descriptor));
    setStatus("captured");
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }

  function handleSkip() {
    onCapture(null);
  }

  return (
    <div className="rounded-xl border border-ink/15 bg-canvas p-4">
      <p className="mb-2 text-fluid-xs font-medium text-ink-soft">{t("label")}</p>

      {status === "error" && <p className="mb-2 text-fluid-xs text-pigment-crimson">{t("error")}</p>}
      {status === "loading" && <p className="mb-2 text-fluid-xs text-ink-faint">{t("loading")}</p>}

      <video ref={videoRef} autoPlay muted playsInline className="mb-3 aspect-video w-full rounded-lg bg-ink" />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCapture}
          disabled={!ready || status === "captured"}
          className="rounded-full bg-pigment-terracotta px-4 py-2 text-fluid-xs font-medium text-canvas transition-opacity disabled:opacity-50"
        >
          {status === "captured" ? t("captured") : t("capture")}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          className="rounded-full border border-ink/15 px-4 py-2 text-fluid-xs font-medium text-ink-soft"
        >
          {t("skip")}
        </button>
      </div>
    </div>
  );
}
