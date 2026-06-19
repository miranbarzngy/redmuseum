'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────
type FaceApiModule = typeof import('face-api.js')
type ScanState = 'loading' | 'searching' | 'locked' | 'captured' | 'error'

interface Props {
  onCapture: (dataUrl: string) => void
  onSkip: () => void
  lang?: 'ku' | 'ar' | 'en'
  compact?: boolean  // smaller viewfinder for inline/form embed
}

// ─── Translations ────────────────────────────────────────────────────────────
const T = {
  ku: {
    title:     'پشکنینی ناسنامەی ڕووخسار',
    subtitle:  'ڕوخسارت سکان بکە',
    loading:   'مۆدێل بارکراوە...',
    searching: 'تکایە ڕوخسارت بهێنە ناوەڕاستی چوارچێوەکە',
    locked:    'ڕووخسار ڕێکە، ئێستا چاو بتروکێنە',
    captured:  'ڕووخسار تۆمارکرا!',
    error:     'کامێرا نەکرایەوە — مۆڵەتی کامێرا چالاک بکە',
    skip:      'تێپەڕاندن (بێ ڕووخسار)',
    retake:    'دووبارە وەرگرتن',
    confirm:   'پشکنین و بەردەوامبوون',
  },
  ar: {
    title:     'التحقق من هوية الوجه',
    subtitle:  'ضع وجهك مباشرةً أمام الكاميرا',
    loading:   'جاري تحميل النموذج...',
    searching: 'يرجى توسيط وجهك داخل الإطار',
    locked:    'الوجه في الموضع الصحيح، ابقَ ثابتاً',
    captured:  'تم التقاط الوجه!',
    error:     'تعذر الوصول إلى الكاميرا — يرجى منح الإذن',
    skip:      'تخطي (بدون وجه)',
    retake:    'إعادة الالتقاط',
    confirm:   'تأكيد والمتابعة',
  },
  en: {
    title:     'Face ID Verification',
    subtitle:  'Look directly at the camera',
    loading:   'Loading detection model…',
    searching: 'Please center your face inside the frame',
    locked:    'Face aligned — hold still',
    captured:  'Face captured!',
    error:     'Camera access denied — please allow camera',
    skip:      'Skip (no face)',
    retake:    'Retake',
    confirm:   'Confirm & Continue',
  },
}
type Tx = typeof T['ku']

// ─── Config ───────────────────────────────────────────────────────────────────
const MODEL_CDN     = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights'
const LOCK_HOLD_MS  = 1500   // ms of sustained pass → auto-capture
const DETECT_PAUSE  = 120    // ms between detection ticks
const INPUT_SIZE    = 224    // TinyFaceDetector input resolution

// Singleton promise — models load once per browser session
let faceApiPromise: Promise<FaceApiModule> | null = null
function getFaceApi(): Promise<FaceApiModule> {
  if (!faceApiPromise) {
    faceApiPromise = import('face-api.js').then(async (fa) => {
      await Promise.all([
        fa.nets.tinyFaceDetector.loadFromUri(MODEL_CDN),
        fa.nets.faceLandmark68Net.loadFromUri(MODEL_CDN),
      ])
      return fa
    })
  }
  return faceApiPromise
}

// ─── Helper ──────────────────────────────────────────────────────────────────
function avgPoint(pts: Array<{ x: number; y: number }>) {
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  }
}

// ─── CameraView (inner — remounted on retake via key) ────────────────────────
function CameraView({
  onCapture,
  tx,
  size = 272,
}: {
  onCapture: (url: string) => void
  tx: Tx
  size?: number
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scanState, setScanState]       = useState<ScanState>('loading')
  const [statusMsg, setStatusMsg]       = useState(tx.loading)
  const [lockProgress, setLockProgress] = useState(0)

  // Keep onCapture stable inside the effect
  const onCaptureRef = useRef(onCapture)
  onCaptureRef.current = onCapture

  useEffect(() => {
    let cancelled  = false
    let detecting  = false
    let lockedSince: number | null = null
    let stream: MediaStream | null = null

    const captureFrame = () => {
      const v = videoRef.current
      if (!v) return
      const c = document.createElement('canvas')
      c.width  = v.videoWidth
      c.height = v.videoHeight
      const ctx = c.getContext('2d')!
      // Un-mirror the saved image so stored face is correct orientation
      ctx.save()
      ctx.scale(-1, 1)
      ctx.drawImage(v, -c.width, 0)
      ctx.restore()
      onCaptureRef.current(c.toDataURL('image/jpeg', 0.85))
    }

    const runDetect = async (fa: FaceApiModule) => {
      if (cancelled || detecting) return
      detecting = true
      try {
        const video = videoRef.current
        if (!video || video.paused || video.readyState < 2) return
        const vw = video.videoWidth
        const vh = video.videoHeight
        if (!vw || !vh) return

        const result = await fa
          .detectSingleFace(video, new fa.TinyFaceDetectorOptions({ inputSize: INPUT_SIZE, scoreThreshold: 0.5 }))
          .withFaceLandmarks()

        if (cancelled) return

        // ── No face detected ─────────────────────────────────────────────
        if (!result) {
          lockedSince = null
          setLockProgress(0)
          setScanState('searching')
          setStatusMsg(tx.searching)
          return
        }

        const { detection, landmarks } = result
        const box       = detection.box
        const positions = landmarks.positions  // 68 Point objects

        // ── 1. High confidence: score > 0.92 ─────────────────────────────
        if (detection.score <= 0.92) {
          lockedSince = null; setLockProgress(0); setScanState('searching'); setStatusMsg(tx.searching); return
        }

        // ── 2. Bounding box must not clip screen edges ────────────────────
        if (box.x <= 0 || box.y <= 0 || box.x + box.width >= vw || box.y + box.height >= vh) {
          lockedSince = null; setLockProgress(0); setScanState('searching'); setStatusMsg(tx.searching); return
        }

        // ── 3. Eye/nose yaw + roll orientation check ──────────────────────
        //   Left eye  → landmarks 36-41, right eye → 42-47, nose tip → 30
        const leftEye  = avgPoint([...positions.slice(36, 42)])
        const rightEye = avgPoint([...positions.slice(42, 48)])
        const noseTip  = positions[30]

        const eyeDist  = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y)
        const eyeMidX  = (leftEye.x + rightEye.x) / 2

        // Yaw: nose must lie within 15% of eye midpoint (rejects side profiles)
        const yawRatio = Math.abs(noseTip.x - eyeMidX) / eyeDist
        // Roll: angle between eye centres must be < 15°
        const rollDeg  = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI)

        if (yawRatio > 0.15 || Math.abs(rollDeg) > 15) {
          lockedSince = null; setLockProgress(0); setScanState('searching'); setStatusMsg(tx.searching); return
        }

        // ── 4. Bounding box center within 15% deviation of canvas center ──
        const boxCx = box.x + box.width  / 2
        const boxCy = box.y + box.height / 2
        if (Math.abs(boxCx - vw / 2) > vw * 0.15 || Math.abs(boxCy - vh / 2) > vh * 0.15) {
          lockedSince = null; setLockProgress(0); setScanState('searching'); setStatusMsg(tx.searching); return
        }

        // ── 5. Face must occupy 30–55% of canvas area ─────────────────────
        const sizeRatio = (box.width * box.height) / (vw * vh)
        if (sizeRatio < 0.30 || sizeRatio > 0.55) {
          lockedSince = null; setLockProgress(0); setScanState('searching'); setStatusMsg(tx.searching); return
        }

        // ── All checks passed → LOCKED ────────────────────────────────────
        setScanState('locked')
        setStatusMsg(tx.locked)

        const now = performance.now()
        if (!lockedSince) lockedSince = now
        const elapsed  = now - lockedSince
        const progress = Math.min(100, (elapsed / LOCK_HOLD_MS) * 100)
        setLockProgress(progress)

        if (elapsed >= LOCK_HOLD_MS) {
          // Prevent further detections, capture the frame
          cancelled = true
          captureFrame()
        }
      } finally {
        detecting = false
        if (!cancelled) setTimeout(() => runDetect(fa), DETECT_PAUSE)
      }
    }

    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

        const video = videoRef.current!
        video.srcObject = stream
        await video.play()

        const fa = await getFaceApi()
        if (cancelled) return

        setScanState('searching')
        setStatusMsg(tx.searching)
        // Small delay to let the video frame stabilise
        setTimeout(() => runDetect(fa), 600)
      } catch {
        if (!cancelled) {
          setScanState('error')
          setStatusMsg(tx.error)
        }
      }
    }

    init()

    return () => {
      cancelled = true
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [tx])  // tx is derived from lang — stable per render

  // ── Ring & badge colours keyed by scan state ──────────────────────────────
  const ringColor = {
    loading:   '#6b7280',
    searching: '#f59e0b',
    locked:    '#10b981',
    captured:  '#10b981',
    error:     '#ef4444',
  }[scanState] ?? '#6b7280'

  const badgeCls = {
    loading:   'bg-gray-700/60 border-gray-600 text-gray-300',
    searching: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
    locked:    'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    captured:  'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    error:     'bg-red-500/15 border-red-500/40 text-red-300',
  }[scanState] ?? ''

  const half         = size / 2
  const r            = half - 3
  const circumference = 2 * Math.PI * r

  return (
    <div className="flex flex-col items-center gap-5">
      {/* ── Circular viewfinder ─────────────────────────────────────── */}
      <div className="relative" style={{ width: size, height: size }}>

        {/* Outer animated ring */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-500"
          style={{
            border: `3px solid ${ringColor}`,
            boxShadow: `0 0 0 4px ${ringColor}18, 0 0 28px ${ringColor}30`,
          }}
        />

        {/* Emerald lock-progress arc (SVG) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={half} cy={half} r={r}
            fill="none"
            stroke="#10b981"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(lockProgress / 100) * circumference} ${circumference}`}
            style={{ transition: 'stroke-dasharray 0.1s linear', opacity: scanState === 'locked' ? 1 : 0 }}
          />
        </svg>

        {/* Corner bracket accents */}
        {(['tl', 'tr', 'bl', 'br'] as const).map(pos => (
          <div
            key={pos}
            className="absolute w-6 h-6 pointer-events-none"
            style={{
              top:    pos.startsWith('t') ? -2 : undefined,
              bottom: pos.startsWith('b') ? -2 : undefined,
              left:   pos.endsWith('l')   ? -2 : undefined,
              right:  pos.endsWith('r')   ? -2 : undefined,
              borderTop:    pos.startsWith('t') ? `3px solid ${ringColor}` : undefined,
              borderBottom: pos.startsWith('b') ? `3px solid ${ringColor}` : undefined,
              borderLeft:   pos.endsWith('l')   ? `3px solid ${ringColor}` : undefined,
              borderRight:  pos.endsWith('r')   ? `3px solid ${ringColor}` : undefined,
              borderRadius: pos === 'tl' ? '4px 0 0 0' : pos === 'tr' ? '0 4px 0 0' : pos === 'bl' ? '0 0 0 4px' : '0 0 4px 0',
              transition: 'border-color 0.5s',
            }}
          />
        ))}

        {/* Video clipped to circle */}
        <div className="absolute inset-[3px] rounded-full overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}  /* mirror for natural selfie */
            muted
            playsInline
            autoPlay
          />
        </div>

        {/* Amber scan-line (searching only) */}
        {scanState === 'searching' && (
          <div className="absolute inset-[3px] rounded-full overflow-hidden pointer-events-none">
            <div
              style={{
                position: 'absolute',
                left: 0, right: 0,
                height: 2,
                background: 'linear-gradient(to right, transparent, rgba(251,191,36,0.5), transparent)',
                animation: 'scanLine 2.2s ease-in-out infinite',
              }}
            />
          </div>
        )}

        {/* Loading spinner overlay */}
        {scanState === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
          </div>
        )}

        {/* Lock icon flash when locked */}
        {scanState === 'locked' && (
          <div
            className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/80 flex items-center justify-center animate-pulse">
              <i className="ri-lock-line text-white text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* ── Status badge ────────────────────────────────────────────── */}
      <div
        className={`px-4 py-2.5 rounded-xl border text-sm font-medium text-center max-w-[260px] leading-snug ${badgeCls}`}
      >
        {statusMsg}
      </div>

      <style>{`
        @keyframes scanLine {
          0%   { top: 8%;  }
          50%  { top: 82%; }
          100% { top: 8%;  }
        }
      `}</style>
    </div>
  )
}

// ─── FacePreview (shown after capture) ───────────────────────────────────────
function FacePreview({
  dataUrl,
  onConfirm,
  onRetake,
  tx,
  lang,
  uploading,
  size = 272,
}: {
  dataUrl: string
  onConfirm: () => void
  onRetake: () => void
  tx: Tx
  lang: string
  uploading: boolean
  size?: number
}) {
  const GOLD    = '#c8a96e'
  const RED     = '#7a0000'
  const ff      = lang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : lang === 'ar' ? 'Cairo, Tahoma, sans-serif' : 'inherit'
  const imgSize = Math.round(size * 0.74)  // preview slightly smaller than viewfinder

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Preview circle */}
      <div className="relative">
        <div
          className="rounded-full overflow-hidden"
          style={{
            width: imgSize, height: imgSize,
            border: '3px solid #10b981',
            boxShadow: '0 0 0 4px rgba(16,185,129,0.15), 0 0 28px rgba(16,185,129,0.25)',
          }}
        >
          <img src={dataUrl} alt="Captured face" className="w-full h-full object-cover" />
        </div>
        {/* Check mark */}
        <div
          className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: '#10b981', border: '3px solid #000' }}
        >
          <i className="ri-check-line text-white text-base font-bold" />
        </div>
      </div>

      {/* Status */}
      <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ fontFamily: ff }}>
        {tx.captured}
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={onConfirm}
          disabled={uploading}
          className="flex items-center gap-2 px-6 py-3 text-white font-bold text-sm rounded-xl disabled:opacity-50 transition-all"
          style={{ background: RED, border: `1px solid rgba(200,169,110,0.35)`, boxShadow: '0 4px 20px rgba(122,0,0,0.35)', fontFamily: ff }}
        >
          {uploading
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <i className="ri-check-double-line" />
          }
          {tx.confirm}
        </button>
        <button
          onClick={onRetake}
          disabled={uploading}
          className="flex items-center gap-2 px-5 py-3 text-white/70 font-medium text-sm rounded-xl disabled:opacity-40 transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: ff }}
        >
          <i className="ri-camera-line" />
          {tx.retake}
        </button>
      </div>
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function LiveCameraCapture({ onCapture, onSkip, lang = 'ku', compact = false }: Props) {
  const tx   = T[lang] ?? T.ku
  const size = compact ? 200 : 272
  const ff   = lang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : lang === 'ar' ? 'Cairo, Tahoma, sans-serif' : 'inherit'
  const isRtl = lang === 'ku' || lang === 'ar'
  const GOLD = '#c8a96e'

  const [phase, setPhase]         = useState<'active' | 'preview'>('active')
  const [capturedUrl, setCaptured] = useState<string | null>(null)
  const [retakeKey, setRetakeKey]  = useState(0)
  const [uploading, setUploading]  = useState(false)

  const handleCapture = useCallback((url: string) => {
    setCaptured(url)
    setPhase('preview')
  }, [])

  const handleRetake = () => {
    setCaptured(null)
    setPhase('active')
    setRetakeKey(k => k + 1)
  }

  const handleConfirm = () => {
    if (capturedUrl) {
      setUploading(true)
      onCapture(capturedUrl)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Title */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="block h-px w-10" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: ff }}>{tx.title}</h2>
          <span className="block h-px w-10" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
        </div>
        <p className="text-white/50 text-sm" style={{ fontFamily: ff }}>{tx.subtitle}</p>
      </div>

      {/* Active camera view */}
      {phase === 'active' && (
        <CameraView key={retakeKey} onCapture={handleCapture} tx={tx} size={size} />
      )}

      {/* Post-capture preview */}
      {phase === 'preview' && capturedUrl && (
        <FacePreview
          dataUrl={capturedUrl}
          onConfirm={handleConfirm}
          onRetake={handleRetake}
          tx={tx}
          lang={lang}
          uploading={uploading}
          size={size}
        />
      )}

      {/* Skip link */}
      {phase === 'active' && (
        <button
          onClick={onSkip}
          className="text-white/35 hover:text-white/60 text-xs underline underline-offset-2 transition-colors mt-1"
          style={{ fontFamily: ff }}
        >
          {tx.skip}
        </button>
      )}
    </div>
  )
}
