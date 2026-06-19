'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────
type FaceApiModule = typeof import('face-api.js')
type ScanState = 'loading' | 'searching' | 'locked' | 'captured' | 'error' | 'model-error'

interface Props {
  onCapture: (dataUrl: string) => void
  onSkip: () => void
  lang?: 'ku' | 'ar' | 'en'
  compact?: boolean
}

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  ku: {
    title:      'پشکنینی ناسنامەی ڕووخسار',
    subtitle:   'ڕوخسارت سکان بکە',
    loading:    'مۆدێل بارکراوە...',
    searching:  'تکایە ڕوخسارت بهێنە ناوەڕاستی چوارچێوەکە',
    locked:     'ڕووخسار ڕێکە، ئێستا چاو بتروکێنە',
    captured:   'ڕووخسار تۆمارکرا!',
    error:      'کامێرا نەکرایەوە — مۆڵەتی کامێرا چالاک بکە',
    modelError: 'نەتوانرا مۆدێلی دیاریکردنی ڕووخسار بار بکرێت',
    skip:       'تێپەڕاندن (بێ ڕووخسار)',
    retake:     'دووبارە وەرگرتن',
    confirm:    'پشکنین و بەردەوامبوون',
  },
  ar: {
    title:      'التحقق من هوية الوجه',
    subtitle:   'ضع وجهك مباشرةً أمام الكاميرا',
    loading:    'جاري تحميل النموذج...',
    searching:  'يرجى توسيط وجهك داخل الإطار',
    locked:     'الوجه في الموضع الصحيح، ابقَ ثابتاً',
    captured:   'تم التقاط الوجه!',
    error:      'تعذر الوصول إلى الكاميرا — يرجى منح الإذن',
    modelError: 'فشل تحميل نموذج الكشف عن الوجه',
    skip:       'تخطي (بدون وجه)',
    retake:     'إعادة الالتقاط',
    confirm:    'تأكيد والمتابعة',
  },
  en: {
    title:      'Face ID Verification',
    subtitle:   'Look directly at the camera',
    loading:    'Loading detection model…',
    searching:  'Please center your face inside the frame',
    locked:     'Face aligned — hold still',
    captured:   'Face captured!',
    error:      'Camera access denied — please allow camera',
    modelError: 'Failed to load face detection model',
    skip:       'Skip (no face)',
    retake:     'Retake',
    confirm:    'Confirm & Continue',
  },
}
type Tx = typeof T['ku']

// ─── Config ───────────────────────────────────────────────────────────────────
// Models served locally from public/models/ — avoids CORS and CDN failures on mobile
const MODEL_PATH   = '/models'
const LOCK_HOLD_MS = 1500
const DETECT_PAUSE = 120
const INPUT_SIZE   = 320

// ─── Singleton model loader ───────────────────────────────────────────────────
let faceApiPromise: Promise<FaceApiModule> | null = null
function getFaceApi(): Promise<FaceApiModule> {
  if (!faceApiPromise) {
    faceApiPromise = import('face-api.js').then(async (fa) => {
      await Promise.all([
        fa.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
        fa.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
      ])
      return fa
    }).catch((err) => {
      console.error('[FaceScan] Model loading failed:', err)
      faceApiPromise = null   // allow retry on next mount
      throw err
    })
  }
  return faceApiPromise
}

// Wait until the video element has real dimensions (iOS Safari race fix)
function waitForVideoReady(video: HTMLVideoElement, timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (video.videoWidth > 0 && video.videoHeight > 0) { resolve(); return }
    const deadline = setTimeout(() => reject(new Error('video metadata timeout')), timeoutMs)
    const onReady = () => {
      clearTimeout(deadline)
      video.removeEventListener('loadedmetadata', onReady)
      video.removeEventListener('loadeddata', onReady)
      resolve()
    }
    video.addEventListener('loadedmetadata', onReady)
    video.addEventListener('loadeddata', onReady)
  })
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function avgPoint(pts: Array<{ x: number; y: number }>) {
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  }
}

// ─── CameraView ───────────────────────────────────────────────────────────────
function CameraView({
  onCapture,
  tx,
  size = 272,
}: {
  onCapture: (url: string) => void
  tx: Tx
  size?: number
}) {
  const videoRef                         = useRef<HTMLVideoElement>(null)
  const [scanState, setScanState]        = useState<ScanState>('loading')
  const [statusMsg, setStatusMsg]        = useState(tx.loading)
  const [lockProgress, setLockProgress]  = useState(0)

  const onCaptureRef = useRef(onCapture)
  onCaptureRef.current = onCapture

  useEffect(() => {
    let cancelled   = false
    let detecting   = false
    let lockedSince: number | null = null
    let stream: MediaStream | null = null
    let detectTimer: ReturnType<typeof setTimeout> | null = null

    // ── Capture at full video resolution, un-mirror ───────────────────────
    const captureFrame = () => {
      const v = videoRef.current
      if (!v) return
      const w = v.videoWidth  || 1280
      const h = v.videoHeight || 720
      const c = document.createElement('canvas')
      c.width  = w
      c.height = h
      const ctx = c.getContext('2d')!
      // Un-mirror: video is CSS-flipped for selfie feel; stored image must be real orientation
      ctx.save()
      ctx.translate(w, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(v, 0, 0, w, h)
      ctx.restore()
      onCaptureRef.current(c.toDataURL('image/jpeg', 0.90))
    }

    const scheduleDetect = (fa: FaceApiModule) => {
      if (cancelled) return
      detectTimer = setTimeout(() => runDetect(fa), DETECT_PAUSE)
    }

    const runDetect = async (fa: FaceApiModule) => {
      if (cancelled || detecting) { scheduleDetect(fa); return }
      detecting = true
      try {
        const video = videoRef.current
        if (!video || video.paused || video.readyState < 2) return

        const vw = video.videoWidth
        const vh = video.videoHeight
        if (!vw || !vh) return

        const result = await fa
          .detectSingleFace(
            video,
            new fa.TinyFaceDetectorOptions({ inputSize: INPUT_SIZE, scoreThreshold: 0.4 }),
          )
          .withFaceLandmarks()

        if (cancelled) return

        // No face
        if (!result) {
          lockedSince = null
          setLockProgress(0)
          setScanState('searching')
          setStatusMsg(tx.searching)
          return
        }

        const { detection, landmarks } = result
        const box       = detection.box
        const positions = landmarks.positions   // 68 points

        const fail = () => {
          lockedSince = null
          setLockProgress(0)
          setScanState('searching')
          setStatusMsg(tx.searching)
        }

        // 1. Confidence > 0.85 (relaxed from 0.92 for low-light environments)
        if (detection.score <= 0.85) { fail(); return }

        // 2. Bounding box must not clip screen edges (4px margin)
        const EDGE = 4
        if (
          box.x < EDGE ||
          box.y < EDGE ||
          box.x + box.width  > vw - EDGE ||
          box.y + box.height > vh - EDGE
        ) { fail(); return }

        // 3. Yaw + Roll from 68-point landmarks
        //    Guard against undefined positions (brief landmark miss)
        const leftEyePts  = positions.slice(36, 42).filter(Boolean)
        const rightEyePts = positions.slice(42, 48).filter(Boolean)
        const noseTip     = positions[30]

        if (leftEyePts.length < 4 || rightEyePts.length < 4 || !noseTip) { fail(); return }

        const leftEye  = avgPoint(leftEyePts)
        const rightEye = avgPoint(rightEyePts)
        const eyeDist  = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y)

        if (eyeDist < 1) { fail(); return }   // degenerate detection

        const eyeMidX  = (leftEye.x + rightEye.x) / 2
        const yawRatio = Math.abs(noseTip.x - eyeMidX) / eyeDist
        const rollDeg  = Math.atan2(
          rightEye.y - leftEye.y,
          rightEye.x - leftEye.x,
        ) * (180 / Math.PI)

        // Yaw ≤ 0.20 (slightly relaxed), Roll < 18°
        if (yawRatio > 0.20 || Math.abs(rollDeg) > 18) { fail(); return }

        // 4. Face center within ±20% of canvas center
        const boxCx = box.x + box.width  / 2
        const boxCy = box.y + box.height / 2
        if (
          Math.abs(boxCx - vw / 2) > vw * 0.20 ||
          Math.abs(boxCy - vh / 2) > vh * 0.20
        ) { fail(); return }

        // 5. Face occupies 25–60% of canvas area
        const sizeRatio = (box.width * box.height) / (vw * vh)
        if (sizeRatio < 0.25 || sizeRatio > 0.60) { fail(); return }

        // ── All checks passed → LOCKED ─────────────────────────────────────
        setScanState('locked')
        setStatusMsg(tx.locked)

        const now = performance.now()
        if (!lockedSince) lockedSince = now
        const elapsed  = now - lockedSince
        const progress = Math.min(100, (elapsed / LOCK_HOLD_MS) * 100)
        setLockProgress(progress)

        if (elapsed >= LOCK_HOLD_MS) {
          cancelled = true   // stop further detections
          captureFrame()
          return             // don't reschedule
        }
      } catch (err) {
        // Swallow transient detection errors; let the loop continue
        console.warn('[FaceScan] detection error:', err)
      } finally {
        detecting = false
        if (!cancelled) scheduleDetect(fa)
      }
    }

    const init = async () => {
      // ── Step 1: Camera access ───────────────────────────────────────────
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn('[FaceScan] Camera access failed:', msg)
        if (!cancelled) { setScanState('error'); setStatusMsg(tx.error) }
        return
      }

      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

      const video = videoRef.current!
      video.srcObject = stream

      // iOS Safari: play() must be awaited; otherwise srcObject is ignored
      try {
        await video.play()
      } catch (err) {
        console.warn('[FaceScan] video.play() failed:', err)
      }

      // ── Step 2: Wait for real video dimensions (iOS Safari race fix) ────
      try {
        await waitForVideoReady(video)
      } catch (err) {
        console.warn('[FaceScan] Video metadata timeout:', err)
        // Non-fatal — the detection loop guards against 0-dimension frames
      }

      if (cancelled) return

      // ── Step 3: Load face-api models from local /models path ────────────
      setScanState('loading')
      setStatusMsg(tx.loading)

      let fa: FaceApiModule
      try {
        fa = await getFaceApi()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[FaceScan] Model loading failed:', msg)
        if (!cancelled) { setScanState('model-error'); setStatusMsg(tx.modelError) }
        return
      }

      if (cancelled) return

      setScanState('searching')
      setStatusMsg(tx.searching)

      // Brief stabilisation delay before first detection tick
      detectTimer = setTimeout(() => runDetect(fa), 600)
    }

    init()

    return () => {
      cancelled = true
      if (detectTimer) clearTimeout(detectTimer)
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [tx])

  // ── Ring colours ───────────────────────────────────────────────────────────
  const ringColor = ({
    loading:      '#6b7280',
    searching:    '#f59e0b',
    locked:       '#10b981',
    captured:     '#10b981',
    error:        '#ef4444',
    'model-error':'#f97316',
  } as Record<ScanState, string>)[scanState] ?? '#6b7280'

  const badgeCls = ({
    loading:      'bg-gray-700/60 border-gray-600 text-gray-300',
    searching:    'bg-amber-500/15 border-amber-500/40 text-amber-300',
    locked:       'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    captured:     'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    error:        'bg-red-500/15 border-red-500/40 text-red-300',
    'model-error':'bg-orange-500/15 border-orange-500/40 text-orange-300',
  } as Record<ScanState, string>)[scanState] ?? ''

  const half         = size / 2
  const r            = half - 3
  const circumference = 2 * Math.PI * r

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Circular viewfinder */}
      <div className="relative" style={{ width: size, height: size }}>

        {/* Static colour ring */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-500"
          style={{
            border:    `3px solid ${ringColor}`,
            boxShadow: `0 0 0 4px ${ringColor}18, 0 0 28px ${ringColor}30`,
          }}
        />

        {/* SVG progress arc (emerald, during locked countdown) */}
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
            style={{
              transition: 'stroke-dasharray 0.1s linear',
              opacity: scanState === 'locked' ? 1 : 0,
            }}
          />
        </svg>

        {/* Corner brackets */}
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
              borderRadius:
                pos === 'tl' ? '4px 0 0 0' :
                pos === 'tr' ? '0 4px 0 0' :
                pos === 'bl' ? '0 0 0 4px' :
                               '0 0 4px 0',
              transition: 'border-color 0.5s',
            }}
          />
        ))}

        {/* Live video clipped to circle */}
        <div className="absolute inset-[3px] rounded-full overflow-hidden bg-black">
          {/*
            iOS Safari: playsInline prevents fullscreen takeover.
            muted + autoPlay required for autoplay policy compliance.
            scaleX(-1) mirrors for natural selfie orientation.
          */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
            muted
            playsInline
            autoPlay
          />
        </div>

        {/* Amber scan-line animation (searching state) */}
        {scanState === 'searching' && (
          <div className="absolute inset-[3px] rounded-full overflow-hidden pointer-events-none">
            <div
              style={{
                position:   'absolute',
                left: 0, right: 0,
                height:     2,
                background: 'linear-gradient(to right, transparent, rgba(251,191,36,0.55), transparent)',
                animation:  'scanLine 2.2s ease-in-out infinite',
              }}
            />
          </div>
        )}

        {/* Loading spinner */}
        {scanState === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
          </div>
        )}

        {/* Lock icon pulse (locked state) */}
        {scanState === 'locked' && (
          <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
            <div className="w-7 h-7 rounded-full bg-emerald-500/80 flex items-center justify-center animate-pulse">
              <i className="ri-lock-line text-white text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Status badge */}
      <div
        className={`px-4 py-2.5 rounded-xl border text-sm font-medium text-center max-w-[280px] leading-snug ${badgeCls}`}
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

// ─── FacePreview ──────────────────────────────────────────────────────────────
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
  const imgSize = Math.round(size * 0.74)

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Captured face preview */}
      <div className="relative">
        <div
          className="rounded-full overflow-hidden"
          style={{
            width:     imgSize,
            height:    imgSize,
            border:    '3px solid #10b981',
            boxShadow: '0 0 0 4px rgba(16,185,129,0.15), 0 0 28px rgba(16,185,129,0.25)',
          }}
        >
          <img src={dataUrl} alt="Captured face" className="w-full h-full object-cover" />
        </div>
        <div
          className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: '#10b981', border: '3px solid #000' }}
        >
          <i className="ri-check-line text-white text-base font-bold" />
        </div>
      </div>

      {/* Captured badge */}
      <div
        className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl text-sm font-medium"
        style={{ fontFamily: ff }}
      >
        {tx.captured}
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={onConfirm}
          disabled={uploading}
          className="flex items-center gap-2 px-6 py-3 text-white font-bold text-sm rounded-xl disabled:opacity-50 transition-all"
          style={{
            background:  RED,
            border:      `1px solid rgba(200,169,110,0.35)`,
            boxShadow:   '0 4px 20px rgba(122,0,0,0.35)',
            fontFamily:  ff,
          }}
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
          style={{
            background: 'rgba(255,255,255,0.06)',
            border:     '1px solid rgba(255,255,255,0.1)',
            fontFamily: ff,
          }}
        >
          <i className="ri-camera-line" />
          {tx.retake}
        </button>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function LiveCameraCapture({ onCapture, onSkip, lang = 'ku', compact = false }: Props) {
  const tx    = T[lang] ?? T.ku
  const size  = compact ? 200 : 272
  const ff    = lang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : lang === 'ar' ? 'Cairo, Tahoma, sans-serif' : 'inherit'
  const isRtl = lang === 'ku' || lang === 'ar'
  const GOLD  = '#c8a96e'

  const [phase, setPhase]          = useState<'active' | 'preview'>('active')
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

      {/* Camera / detection */}
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

      {/* Skip */}
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
