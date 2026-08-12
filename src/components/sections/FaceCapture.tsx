"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// face-api.js touches `window` and camera APIs, so this component is only
// ever mounted via next/dynamic with ssr:false (see BookingClient.tsx) —
// importing it eagerly here would break server rendering.
import * as faceapi from "face-api.js";

const MODEL_URL = "/models";

// Liveness check: face-api.js has no built-in anti-spoofing model, so we
// approximate it with a challenge-response blink check over a short window
// of the live video stream — a static photo or screen held up to the camera
// won't blink, a real person will.
const LIVENESS_WINDOW_MS = 4000;
const LIVENESS_SAMPLE_INTERVAL_MS = 120;
const BLINK_CLOSE_RATIO = 0.8; // EAR must dip below this fraction of the open-eye baseline
const BLINK_REOPEN_RATIO = 0.9; // ...then recover above this fraction to count as a full blink

type Status = "loading" | "idle" | "checking-liveness" | "liveness-failed" | "captured" | "error";

function eyeAspectRatio(eye: faceapi.Point[]): number {
  const dist = (a: faceapi.Point, b: faceapi.Point) => Math.hypot(a.x - b.x, a.y - b.y);
  const vertical = dist(eye[1], eye[5]) + dist(eye[2], eye[4]);
  const horizontal = dist(eye[0], eye[3]);
  return horizontal === 0 ? 0 : vertical / (2 * horizontal);
}

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

  async function runLivenessCheck(): Promise<boolean> {
    const video = videoRef.current;
    if (!video) return false;

    let baselineEar: number | null = null;
    let sawClosedEye = false;
    let blinkDetected = false;
    const deadline = Date.now() + LIVENESS_WINDOW_MS;

    while (Date.now() < deadline && !blinkDetected) {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (detection) {
        const ear = (eyeAspectRatio(detection.landmarks.getLeftEye()) + eyeAspectRatio(detection.landmarks.getRightEye())) / 2;

        if (baselineEar === null) {
          baselineEar = ear;
        } else if (!sawClosedEye && ear < baselineEar * BLINK_CLOSE_RATIO) {
          sawClosedEye = true;
        } else if (sawClosedEye && ear > baselineEar * BLINK_REOPEN_RATIO) {
          blinkDetected = true;
        } else if (ear > baselineEar) {
          // Track the highest observed "eyes open" reading as the baseline,
          // since lighting/angle drift during the window otherwise causes
          // false negatives.
          baselineEar = ear;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, LIVENESS_SAMPLE_INTERVAL_MS));
    }

    return blinkDetected;
  }

  async function handleCapture() {
    if (!videoRef.current) return;
    setStatus("checking-liveness");

    const isLive = await runLivenessCheck();
    if (!isLive) {
      setStatus("liveness-failed");
      return;
    }

    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setStatus("liveness-failed");
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
      {status === "checking-liveness" && <p className="mb-2 text-fluid-xs text-ink-faint">{t("checkingLiveness")}</p>}
      {status === "liveness-failed" && <p className="mb-2 text-fluid-xs text-pigment-crimson">{t("livenessFailed")}</p>}

      <video ref={videoRef} autoPlay muted playsInline className="mb-3 aspect-video w-full rounded-lg bg-ink" />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCapture}
          disabled={!ready || status === "captured" || status === "checking-liveness"}
          className="rounded-full bg-[#850B10] px-4 py-2 text-fluid-xs font-medium text-canvas transition-opacity disabled:opacity-50"
        >
          {status === "captured"
            ? t("captured")
            : status === "liveness-failed"
              ? t("retry")
              : t("capture")}
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
