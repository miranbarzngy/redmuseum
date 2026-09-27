"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, Loader2, RotateCcw, X } from "lucide-react";
import clsx from "clsx";

// Guided selfie capture for the booking wizard. Opens the front camera,
// waits until a face is well framed (centered, right size, facing the
// camera, not tilted), then takes a small JPEG on a blink or after the face
// holds still for HOLD_MS.
//
// Everything runs on the device — only the final photo leaves it, and the
// parent does that upload. This is NOT face recognition (nothing is ever
// identified or compared) and NOT anti-spoofing: the blink is a light
// liveness cue, and a held-up photo or replayed video can still pass through
// the auto-capture timer.

type FaceApi = typeof import("@vladmandic/face-api/dist/face-api.esm.js");

// Self-hosted copies of node_modules/@vladmandic/face-api/model (see
// public/models/README.md) — same origin, so CSP and the proxy matcher
// don't need to know about a model CDN.
const MODEL_URL = "/models";

const DETECT_EVERY_N_FRAMES = 6; // ~5 detections/s on a 30 fps camera
const HOLD_MS = 2500;
const GRACE_MS = 400;
const INIT_TIMEOUT_MS = 20_000;
const MAX_DETECT_ERRORS = 25;
const EAR_THRESHOLD = 0.21;
const BLINK_CAPTURE_DELAY_MS = 250;
const FLASH_MS = 350;
const PHOTO_MAX_SIDE = 240;
const PHOTO_QUALITY = 0.6;

// Searching state uses the museum red of the site's buttons. Hint text gets
// a lighter tint of it — #850B10 itself is unreadable (~1.6:1) as text on
// the dark backdrop; the tint clears ~5:1.
const MUSEUM_RED = "#850B10";
const MUSEUM_RED_TEXT = "#D98A8E";
const EMERALD = "#10b981";

type Phase = "loading" | "searching" | "face_found" | "captured" | "error";
type LoadStep = "camera" | "detector" | "landmarks";
type Hint = "none" | "partial";
type BlinkState = "open" | "closing";
type ErrorKey = "permission" | "loadFailed" | "cameraStopped" | "cameraProblem";

type Pt = { x: number; y: number };
type FaceResult = {
  detection: { score: number; box: { x: number; y: number; width: number; height: number } };
  landmarks: { positions: Pt[]; getLeftEye(): Pt[]; getRightEye(): Pt[] };
};

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** "invalid" = no usable face; "misaligned" = a face, but badly framed. */
function validateFace(result: FaceResult, videoW: number, videoH: number): "invalid" | "misaligned" | "valid" {
  const { score, box } = result.detection;
  if (score < 0.92) return "invalid";
  if (box.x < 0 || box.y < 0 || box.x + box.width > videoW || box.y + box.height > videoH) return "misaligned";
  const ratio = (box.width * box.height) / (videoW * videoH);
  if (ratio < 0.3 || ratio > 0.55) return "misaligned";
  const cx = (box.x + box.width / 2) / videoW - 0.5;
  const cy = (box.y + box.height / 2) / videoH - 0.5;
  if (Math.abs(cx) > 0.15 || Math.abs(cy) > 0.15) return "misaligned";

  const p = result.landmarks.positions; // 68-point model
  const avg = (ix: number[]) => ({
    x: ix.reduce((s, i) => s + p[i].x, 0) / ix.length,
    y: ix.reduce((s, i) => s + p[i].y, 0) / ix.length,
  });
  const rEye = avg([36, 37, 38, 39, 40, 41]);
  const lEye = avg([42, 43, 44, 45, 46, 47]);
  const nose = p[30];
  const roll = (Math.atan2(lEye.y - rEye.y, lEye.x - rEye.x) * 180) / Math.PI;
  if (Math.abs(roll) > 15) return "misaligned";
  const eyeDist = Math.abs(lEye.x - rEye.x);
  const yaw = eyeDist > 0 ? Math.abs(nose.x - (rEye.x + lEye.x) / 2) / eyeDist : 0;
  if (yaw > 0.25) return "misaligned";
  return "valid";
}

/** Eye Aspect Ratio over the 6 points of one eye — drops sharply on a blink. */
const ear = (e: Pt[]) => (e.length < 6 ? 1 : (dist(e[1], e[5]) + dist(e[2], e[4])) / (2 * dist(e[0], e[3])));

// Model loads are shared across sessions, so Retry/Retake reuse a finished
// (or still in-flight) download instead of fetching the weights again. A
// failed load is dropped so the next attempt starts fresh.
const modelLoads = new Map<string, Promise<void>>();
function loadOnce(key: string, load: () => Promise<void>): Promise<void> {
  let pending = modelLoads.get(key);
  if (!pending) {
    pending = load().catch((err) => {
      modelLoads.delete(key);
      throw err;
    });
    modelLoads.set(key, pending);
  }
  return pending;
}

function stopStream(ref: RefObject<MediaStream | null>) {
  ref.current?.getTracks().forEach((track) => track.stop());
  ref.current = null;
}

function isPermissionError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "NotAllowedError";
}

export function FaceScanCapture({
  onCapture,
  onCancel,
}: {
  onCapture: (jpegDataUrl: string) => void;
  onCancel: () => void;
}) {
  // Retry and Retake remount the session (fresh camera, fresh state machine)
  // rather than reloading the page, which would wipe the booking form.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Freeze the page behind the overlay — Lenis drives wheel scrolling
    // itself, so overflow:hidden alone doesn't stop it.
    const lenis = (window as unknown as { lenis?: { stop(): void; start(): void } }).lenis;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lenis?.stop();
    return () => {
      document.body.style.overflow = prevOverflow;
      lenis?.start();
      opener?.focus?.();
    };
  }, []);

  // Portaled to <body>: the booking wizard animates its steps with
  // transforms, and a transformed ancestor would trap position:fixed inside
  // the card instead of covering the screen.
  return createPortal(
    <ScanSession
      key={attempt}
      onUse={onCapture}
      onClose={onCancel}
      onRestart={() => setAttempt((a) => a + 1)}
    />,
    document.body
  );
}

function ScanSession({
  onUse,
  onClose,
  onRestart,
}: {
  onUse: (jpegDataUrl: string) => void;
  onClose: () => void;
  onRestart: () => void;
}) {
  const t = useTranslations("booking.faceScan");
  const titleId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhaseState] = useState<Phase>("loading");
  const [loadStep, setLoadStep] = useState<LoadStep>("camera");
  const [hint, setHint] = useState<Hint>("none");
  const [progress, setProgress] = useState(0);
  const [flash, setFlash] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<ErrorKey>("loadFailed");

  useEffect(() => {
    // The detection engine lives entirely in this closure. `phase` is read
    // by the rAF loop, so it's kept here AND in state (for rendering) —
    // always update both through setPhase(). `mounted` is re-checked after
    // every await so nothing touches a torn-down session.
    let mounted = true;
    let phase: Phase = "loading";
    let faceapi: FaceApi | null = null;
    let options: InstanceType<FaceApi["TinyFaceDetectorOptions"]> | null = null;
    let raf = 0;
    let frame = 0;
    let busy = false;
    let pendingCapture = false;
    let lockedAt = 0;
    let missSince: number | null = null;
    let blink: BlinkState = "open";
    let errorCount = 0;
    const timers = new Set<number>();

    const setPhase = (next: Phase) => {
      phase = next;
      setPhaseState(next);
    };
    const stillLoading = () => mounted && phase === "loading";
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    };
    const clearTimers = () => {
      timers.forEach((id) => clearTimeout(id));
      timers.clear();
    };

    const fail = (key: ErrorKey) => {
      if (!mounted || phase === "error") return;
      cancelAnimationFrame(raf);
      clearTimers();
      stopStream(streamRef);
      setFlash(false);
      setErrorKey(key);
      setPhase("error");
    };

    const unlock = () => {
      lockedAt = 0;
      missSince = null;
      blink = "open";
      setProgress(0);
      setPhase("searching");
    };

    const capture = () => {
      const video = videoRef.current;
      if (!mounted || phase !== "face_found" || !video) return;
      cancelAnimationFrame(raf);

      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(vw, vh));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(vw * scale);
      canvas.height = Math.round(vh * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        fail("cameraProblem");
        return;
      }
      // Mirrored so the photo matches the selfie preview the visitor saw.
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", PHOTO_QUALITY);

      stopStream(streamRef);
      setPhoto(dataUrl);
      setProgress(1);
      setPhase("captured");
    };

    const onBlink = () => {
      pendingCapture = true;
      setFlash(true);
      later(() => setFlash(false), FLASH_MS);
      later(capture, BLINK_CAPTURE_DELAY_MS);
    };

    const detect = async (video: HTMLVideoElement) => {
      if (!faceapi || !options) return;
      let result: FaceResult | undefined;
      try {
        result = await faceapi.detectSingleFace(video, options).withFaceLandmarks(true);
        errorCount = 0;
      } catch (err) {
        // A lost WebGL context makes every call throw, silently, forever.
        errorCount += 1;
        if (errorCount >= MAX_DETECT_ERRORS) {
          console.error("Face scan detection keeps failing:", err);
          fail("cameraProblem");
        }
        return;
      }
      if (!mounted || pendingCapture || (phase !== "searching" && phase !== "face_found")) return;

      const now = performance.now();
      const verdict = result ? validateFace(result, video.videoWidth || 640, video.videoHeight || 480) : "invalid";

      if (!result || verdict !== "valid") {
        setHint(verdict === "misaligned" ? "partial" : "none");
        // Grace period: progress freezes from the FIRST missed frame; only
        // once the face has been gone longer than GRACE_MS is the lock lost.
        if (phase === "face_found") {
          if (missSince === null) missSince = now;
          else if (now - missSince > GRACE_MS) unlock();
        }
        return;
      }

      if (phase === "face_found" && missSince !== null) {
        // A face coming back after a long gap must not capture instantly on
        // the time it was gone: drop the lock and re-lock from zero below.
        // A short dropout keeps the lock, and the gap doesn't count as held.
        if (now - missSince > GRACE_MS) unlock();
        else lockedAt += now - missSince;
        missSince = null;
      }
      if (phase === "searching") {
        lockedAt = now;
        blink = "open";
        setHint("none");
        setProgress(0);
        setPhase("face_found");
      }

      const avgEar = (ear(result.landmarks.getLeftEye()) + ear(result.landmarks.getRightEye())) / 2;
      if (blink === "open" && avgEar < EAR_THRESHOLD) {
        blink = "closing";
      } else if (blink === "closing" && avgEar >= EAR_THRESHOLD) {
        onBlink();
        return;
      }

      const held = now - lockedAt;
      setProgress(Math.min(held / HOLD_MS, 1));
      if (held >= HOLD_MS) capture();
    };

    const tick = () => {
      if (!mounted || (phase !== "searching" && phase !== "face_found")) return;
      raf = requestAnimationFrame(tick);
      frame = (frame + 1) % DETECT_EVERY_N_FRAMES;
      const video = videoRef.current;
      if (frame !== 0 || busy || pendingCapture || !video || video.readyState < 2) return;
      // One detection at a time — on a slow phone a detection can outlast
      // the 6-frame gap, and overlapping results would arrive out of order.
      busy = true;
      void detect(video).finally(() => {
        busy = false;
      });
    };

    // The OS/browser can kill the camera (app switch, permission revoked);
    // without this the UI would freeze on the last frame.
    const onTrackEnded = () => {
      if (phase !== "captured") fail("cameraStopped");
    };
    // Backgrounding mid-scan always ends the session with a retryable error
    // (and turns the camera off) — not every browser ends the track itself,
    // and a stale lock must never capture the moment the tab comes back.
    // Only once the camera is live: some in-app browsers hide the page
    // behind their native permission dialog while getUserMedia is pending.
    const onVisibilityChange = () => {
      if (document.visibilityState !== "hidden") return;
      if (phase === "searching" || phase === "face_found" || (phase === "loading" && streamRef.current)) {
        fail("cameraStopped");
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const watchdog = later(() => {
      // Covers a stalled getUserMedia or a model download that never
      // settles. Forget unfinished loads so Retry starts a fresh download.
      modelLoads.clear();
      fail("loadFailed");
    }, INIT_TIMEOUT_MS);

    (async () => {
      // Camera first, so the visitor sees themselves while models download.
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch (err) {
        if (!stillLoading()) return;
        console.error("Face scan camera request failed:", err);
        fail(isPermissionError(err) ? "permission" : "loadFailed");
        return;
      }
      if (!stillLoading()) {
        // Resolved after unmount / watchdog — release it straight away.
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      stream.getVideoTracks().forEach((track) => track.addEventListener("ended", onTrackEnded));
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        // iOS Safari ignores srcObject unless play() is explicitly called.
        await video.play().catch(() => {});
      }
      if (!stillLoading()) return;

      try {
        setLoadStep("detector");
        const api = await import("@vladmandic/face-api/dist/face-api.esm.js");
        if (!stillLoading()) return;
        await loadOnce("detector", () => api.nets.tinyFaceDetector.loadFromUri(MODEL_URL));
        if (!stillLoading()) return;
        setLoadStep("landmarks");
        await loadOnce("landmarks", () => api.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL));
        if (!stillLoading()) return;
        faceapi = api;
        options = new api.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
      } catch (err) {
        if (!stillLoading()) return;
        console.error("Face scan model load failed:", err);
        fail("loadFailed");
        return;
      }

      clearTimeout(watchdog);
      timers.delete(watchdog);
      setPhase("searching");
      raf = requestAnimationFrame(tick);
    })();

    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      clearTimers();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stopStream(streamRef);
    };
  }, []);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      stopStream(streamRef);
      onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleClose() {
    // Stop here too, not just on unmount, so the camera light goes off even
    // if the parent keeps the overlay mounted for an exit animation.
    stopStream(streamRef);
    onClose();
  }

  const locked = phase === "face_found" || phase === "captured";
  const accent = phase === "error" ? "rgba(255,255,255,0.3)" : locked ? EMERALD : MUSEUM_RED;
  const spinning = phase === "loading" || phase === "searching" || phase === "face_found";
  const ringBackground =
    phase === "face_found"
      ? `conic-gradient(from 0deg, ${EMERALD}59, ${EMERALD})`
      : phase === "captured"
        ? EMERALD
        : `conic-gradient(from 0deg, transparent 0deg, ${phase === "error" ? "transparent" : MUSEUM_RED} 180deg, transparent 180deg)`;
  const ringMask = "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))";

  const loadTitle =
    loadStep === "camera" ? t("openingCamera") : loadStep === "detector" ? t("loadingDetector") : t("loadingLandmarks");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-lenis-prevent
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center overflow-y-auto bg-black/80 px-4 py-20 text-white backdrop-blur-md"
    >
      <h2
        id={titleId}
        className="absolute inset-x-16 top-[max(1.4rem,env(safe-area-inset-top))] text-center text-fluid-xs font-medium tracking-wide text-white/70"
      >
        {t("title")}
      </h2>
      <button
        ref={closeRef}
        type="button"
        onClick={handleClose}
        aria-label={t("close")}
        className="absolute end-4 top-[max(1rem,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        <X size={20} />
      </button>

      <div className="relative h-[268px] w-[268px] shrink-0">
        {/* Corner brackets */}
        <div className="pointer-events-none absolute -inset-1.5">
          {[
            "left-0 top-0 rounded-tl-xl border-l-2 border-t-2",
            "right-0 top-0 rounded-tr-xl border-r-2 border-t-2",
            "bottom-0 left-0 rounded-bl-xl border-b-2 border-l-2",
            "bottom-0 right-0 rounded-br-xl border-b-2 border-r-2",
          ].map((pos) => (
            <span
              key={pos}
              className={clsx("absolute h-7 w-7 transition-colors duration-500", pos)}
              style={{ borderColor: accent }}
            />
          ))}
        </div>

        {/* Outer ring: dashed + pulsing while searching, solid + glow when locked */}
        <div
          className={clsx(
            "absolute inset-0 rounded-full border-2 transition-[border-color,box-shadow] duration-500",
            locked ? "border-solid" : "fs-pulse border-dashed"
          )}
          style={{ borderColor: accent, boxShadow: locked ? `0 0 28px ${EMERALD}73` : "none" }}
        />

        {/* Rotating conic ring */}
        <div
          className={clsx("absolute inset-[5px] rounded-full", spinning && "fs-spin", phase === "face_found" && "fs-spin-fast")}
          style={{ background: ringBackground, WebkitMask: ringMask, mask: ringMask }}
        />

        {/* Viewport — 268 − 2×11 = 246px */}
        <div className="absolute inset-[11px] overflow-hidden rounded-full bg-neutral-900">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={clsx("h-full w-full object-cover", photo && "invisible")}
            style={{ transform: "scaleX(-1)" }}
          />

          {photo && (
            // The capture is already mirrored — shown as-is, no flip.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}

          {phase === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35">
              <Loader2 size={36} className="animate-spin text-white/90" />
            </div>
          )}

          {phase === "searching" && (
            <div
              className="fs-scan absolute inset-x-6 h-0.5 rounded-full"
              style={{
                background: `linear-gradient(to right, transparent, ${MUSEUM_RED}, transparent)`,
                boxShadow: `0 0 12px ${MUSEUM_RED}`,
              }}
            />
          )}

          {phase === "face_found" && (
            <div
              className="absolute inset-0"
              style={{ background: `conic-gradient(${EMERALD}4d ${progress * 360}deg, transparent 0deg)` }}
            />
          )}

          {flash && <div className="fs-flash absolute inset-0 bg-white" />}

          {phase === "captured" && (
            <span className="absolute bottom-4 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg ring-4 ring-black/25">
              <Check size={20} strokeWidth={3} />
            </span>
          )}

          {phase === "error" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <AlertCircle size={36} className="text-red-400" />
            </div>
          )}
        </div>

        {phase === "face_found" && (
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-white shadow-lg">
            {t("faceDetected")}
          </span>
        )}
      </div>

      <div aria-live="polite" className="mt-9 flex min-h-[8.5rem] w-full max-w-xs flex-col items-center gap-1.5 text-center">
        {phase === "loading" && (
          <>
            <p className="text-fluid-sm font-medium">{loadTitle}</p>
            <p className="text-fluid-xs text-white/60">{t("loadingSubtitle")}</p>
          </>
        )}

        {phase === "searching" &&
          (hint === "partial" ? (
            <>
              <p className="text-fluid-sm font-medium" style={{ color: MUSEUM_RED_TEXT }}>
                {t("partialTitle")}
              </p>
              <p className="text-fluid-xs text-white/60">{t("partialSubtitle")}</p>
            </>
          ) : (
            <>
              <p className="text-fluid-sm font-medium">{t("searchingTitle")}</p>
              <p className="text-fluid-xs text-white/60">{t("searchingSubtitle")}</p>
            </>
          ))}

        {phase === "face_found" && (
          <>
            <p className="text-fluid-xs font-medium" style={{ color: EMERALD }}>
              {t("alignedTitle")}
            </p>
            <p className="text-fluid-lg font-semibold">{t("blinkNow")}</p>
            <p className="text-fluid-xs text-white/60">{t("orWait")}</p>
            <div className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full transition-[width] duration-200 ease-linear"
                style={{ width: `${progress * 100}%`, background: EMERALD }}
              />
            </div>
          </>
        )}

        {phase === "captured" && photo && (
          <>
            <p className="text-fluid-sm font-medium" style={{ color: EMERALD }}>
              {t("captured")}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onRestart}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-fluid-sm font-medium text-white transition-colors hover:border-white/50"
              >
                <RotateCcw size={16} />
                {t("retake")}
              </button>
              <button
                type="button"
                onClick={() => onUse(photo)}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-fluid-sm font-medium text-white shadow-lg transition-transform hover:scale-[1.03] active:scale-95"
              >
                {t("use")}
              </button>
            </div>
          </>
        )}

        {phase === "error" && (
          <>
            <p className="text-fluid-sm font-medium text-red-300">{t(`errors.${errorKey}`)}</p>
            <button
              type="button"
              onClick={onRestart}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-fluid-sm font-medium text-neutral-900 transition-transform hover:scale-[1.03] active:scale-95"
            >
              <RotateCcw size={16} />
              {t("retry")}
            </button>
          </>
        )}
      </div>

      <style>{`
        .fs-spin { animation: fsSpin 2.2s linear infinite; }
        .fs-spin-fast { animation-duration: 1.2s; }
        .fs-pulse { animation: fsPulse 1.6s ease-in-out infinite; }
        .fs-scan { animation: fsScan 2.4s ease-in-out infinite; }
        .fs-flash { animation: fsFlash ${FLASH_MS}ms ease-out forwards; }
        @keyframes fsSpin { to { transform: rotate(360deg); } }
        @keyframes fsPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fsScan { 0%, 100% { top: 18%; } 50% { top: 82%; } }
        @keyframes fsFlash { from { opacity: 0.9; } to { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .fs-spin, .fs-pulse, .fs-scan { animation: none; }
          .fs-scan { top: 50%; }
        }
      `}</style>
    </div>
  );
}
