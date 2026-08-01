'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseClient } from '../lib/supabase-client'
import { useMuseumName } from '../lib/useMuseumName'
import Image from 'next/image'

const SLIDE_DURATION = 6000
const TICK_MS        = 80
const TICK_STEP      = (TICK_MS / SLIDE_DURATION) * 100

/* ─────────────────────────────────────────────────────────────────
   Entrance keyframes
───────────────────────────────────────────────────────────────── */
const HERO_CSS = `
  @keyframes hFadeUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes hScaleIn {
    from { opacity:0; transform:scale(0.94) translateY(14px); }
    to   { opacity:1; transform:scale(1) translateY(0); }
  }
  @keyframes ambientDrift {
    0%,100% { transform:scale(1) translate(0,0);          opacity:0.5;  }
    33%      { transform:scale(1.10) translate(10px,-6px); opacity:0.7;  }
    66%      { transform:scale(0.96) translate(-6px,8px);  opacity:0.45; }
  }
  .h-up  { animation: hFadeUp  0.6s  cubic-bezier(.22,1,.36,1) both; }
  .h-img { animation: hScaleIn 0.75s cubic-bezier(.22,1,.36,1) both; }
  .d1 { animation-delay: .07s; }
  .d2 { animation-delay: .16s; }
  .d3 { animation-delay: .28s; }
  .d4 { animation-delay: .42s; }
  .d5 { animation-delay: .56s; }
`

/* ─────────────────────────────────────────────────────────────────
   CountdownBadge — full-size (desktop) or compact (mobile)
───────────────────────────────────────────────────────────────── */
function CountdownBadge({ targetTime, lang, kuFont, compact = false, onFinish }) {
  const [parts, setParts] = useState({ d: '--', h: '--', m: '--', s: '--' })
  const doneRef = useRef(false)

  useEffect(() => {
    doneRef.current = false
    const tick = () => {
      const diff = new Date(targetTime) - Date.now()
      if (diff <= 0) {
        setParts({ d: '00', h: '00', m: '00', s: '00' })
        if (!doneRef.current) { doneRef.current = true; onFinish?.() }
        return
      }
      setParts({
        d: String(Math.floor(diff / 86400000)).padStart(2, '0'),
        h: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
        s: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetTime]) // eslint-disable-line react-hooks/exhaustive-deps

  const labels = lang === 'ku' ? ['ڕۆژ', 'کاتژمێر', 'خولەک', 'چرکە']
    : lang === 'ar' ? ['يوم', 'ساعة', 'دقيقة', 'ثانية']
    : ['D', 'H', 'M', 'S']
  const vals = [parts.d, parts.h, parts.m, parts.s]

  /* ── Compact inline version for mobile meta row ── */
  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
        }}
        dir="ltr"
      >
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <circle cx="8" cy="8" r="6.5" stroke="#f59e0b" strokeWidth="1.4"/>
          <path d="M8 5v3.5L10 10" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <span
          className="text-white font-black"
          style={{ fontFamily: "'Courier New',monospace", fontSize: '11px', fontVariantNumeric: 'tabular-nums' }}
        >
          {vals[0]}<span className="text-amber-400/60">:</span>{vals[1]}<span className="text-amber-400/60">:</span>{vals[2]}<span className="text-amber-400/60">:</span>{vals[3]}
        </span>
      </div>
    )
  }

  /* ── Full version for desktop ── */
  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-2"
      style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.13)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.22)',
      }}
      dir="ltr"
    >
      <span
        className="hidden sm:inline text-amber-400/70 font-bold uppercase tracking-[0.2em] mr-1.5"
        style={{ fontSize: '8px', ...kuFont }}
      >
        {lang === 'ku' ? 'ماوە' : lang === 'ar' ? 'العد' : 'Timer'}
      </span>
      {vals.map((v, i) => (
        <div key={i} className="flex items-center gap-0.5 sm:gap-1">
          <div className="flex flex-col items-center gap-0.5">
            <span
              className="text-white font-black leading-none"
              style={{ fontFamily: "'Courier New',monospace", fontSize: 'clamp(12px,2.2vw,20px)', fontVariantNumeric: 'tabular-nums' }}
            >
              {v}
            </span>
            <span className="text-white/35 uppercase leading-none" style={{ fontSize: '6px', letterSpacing: '0.06em', ...kuFont }}>
              {labels[i]}
            </span>
          </div>
          {i < 3 && (
            <span className="text-amber-400/50 font-black" style={{ fontSize: 'clamp(11px,1.8vw,16px)', lineHeight: 1, paddingBottom: '8px' }}>
              :
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Arrow button — hidden on mobile via hidden md:flex
───────────────────────────────────────────────────────────────── */
function ArrowBtn({ onClick, dir: direction }) {
  const [hovered, setHovered] = useState(false)
  const posClass = direction === 'prev' ? 'left-3 md:left-4' : 'right-3 md:right-4'

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`hidden md:flex absolute ${posClass} top-1/2 z-20 w-10 h-10 rounded-full items-center justify-center transition-all duration-200 active:scale-90`}
      style={{
        transform: 'translateY(-50%)',
        background: hovered ? 'rgba(245,158,11,0.92)' : 'rgba(0,0,0,0.32)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${hovered ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.18)'}`,
        boxShadow: hovered ? '0 0 22px rgba(245,158,11,0.35)' : '0 4px 14px rgba(0,0,0,0.28)',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke={hovered ? '#0c0a09' : 'white'}
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      >
        {direction === 'prev' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Shared image card innards — reused in both layouts
───────────────────────────────────────────────────────────────── */
function ImageCardInner({ slide, current, total, getText, isRtl, kuFont }) {
  return (
    <>

      {/* Image */}
      {slide.image_url
        ? <Image src={slide.image_url} alt={getText(slide, 'title')} fill className="object-cover object-center" unoptimized sizes="(max-width: 767px) 100vw, 360px" />
        : <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <span className="text-5xl opacity-20">🏛️</span>
          </div>
      }

    </>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Museum name pill (reused in both layouts)
───────────────────────────────────────────────────────────────── */
function MuseumPill({ musName, kuFont }) {
  return (
    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-900/90 text-white px-3 py-1 rounded-full border border-white/20 shadow-lg backdrop-blur-md whitespace-nowrap max-w-[85vw]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/android-chrome-192x192.png" alt="" className="w-4 h-4 rounded object-contain shrink-0" />
      <span style={{ fontSize: '11px', ...kuFont }}>{musName}</span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────── */
export default function ExclusiveSection({ currentLang = 'ku' }) {
  const [slides, setSlides]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [current, setCurrent]   = useState(0)
  const [animKey, setAnimKey]   = useState(0)
  const [progress, setProgress] = useState(0)
  const [countdownDone, setCountdownDone] = useState(false)

  const pausedRef    = useRef(false)
  const progRef      = useRef(0)
  const slidesRef    = useRef([])
  const currRef      = useRef(0)
  const touchStartX  = useRef(null)
  const museumName   = useMuseumName()

  useEffect(() => { slidesRef.current = slides }, [slides])
  useEffect(() => { currRef.current   = current }, [current])

  const lang    = currentLang === 'ku' ? 'ku' : currentLang === 'ar' ? 'ar' : 'en'
  const isRtl   = lang === 'ku' || lang === 'ar'
  const musName = lang === 'ar' ? museumName.ar : lang === 'ku' ? museumName.kr : museumName.en
  const kuFont  = lang === 'ku' ? { fontFamily: 'UniSalar, Tahoma, sans-serif' }
    : lang === 'ar' ? { fontFamily: 'ArabicFont, Tahoma, sans-serif' } : {}

  const getText = (s, f) => s[`${f}_${lang}`] || s[`${f}_en`] || ''

  /* ── Data fetch ── */
  const fetchSlides = useCallback(async () => {
    const sb = getSupabaseClient()
    if (!sb) { setLoading(false); return }
    try {
      const { data } = await sb.from('exclusive_slides').select('*')
        .eq('is_active', true).order('sort_order', { ascending: true })
      setSlides(data || [])
    } catch (e) {
      console.error('ExclusiveSection:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const sb = getSupabaseClient()
    if (!sb) { setLoading(false); return }
    fetchSlides()
  }, [fetchSlides])

  /* ── Navigation ── */
  const goTo = useCallback((idx) => {
    const total = slidesRef.current.length
    if (total < 2) return
    const next = ((idx % total) + total) % total
    progRef.current = 0
    setProgress(0)
    setCurrent(next)
    setAnimKey(k => k + 1)
  }, [])

  /* ── Auto-advance ── */
  useEffect(() => {
    if (slides.length < 2) return
    const id = setInterval(() => {
      if (pausedRef.current) return
      if (slidesRef.current[currRef.current]?.is_locked) return
      progRef.current += TICK_STEP
      setProgress(progRef.current)
      if (progRef.current >= 100) {
        progRef.current = 0
        setProgress(0)
        const next = (currRef.current + 1) % slidesRef.current.length
        setCurrent(next)
        setAnimKey(k => k + 1)
      }
    }, TICK_MS)
    return () => clearInterval(id)
  }, [slides.length])

  /* ── Countdown done flag ── */
  useEffect(() => {
    const s = slides[current]
    if (!s?.countdown_to) { setCountdownDone(false); return }
    setCountdownDone(new Date(s.countdown_to) <= new Date())
  }, [current, slides])

  /* ── Touch swipe ── */
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    pausedRef.current = true
  }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) {
      goTo(dx > 0 ? currRef.current - 1 : currRef.current + 1)
    }
    touchStartX.current = null
    pausedRef.current = false
  }

  /* ── Loading / empty ── */
  if (loading) {
    return (
      <section id="exclusive-section" className="h-[calc(100dvh-4rem)] md:h-screen flex items-center justify-center bg-slate-950">
        <div className="w-9 h-9 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </section>
    )
  }
  if (!slides.length) return null

  const slide = slides[current]

  /* ── Shared meta pill helpers ── */
  const datePill = slide.event_date && (() => {
    const d = new Date(slide.event_date)
    const fmt = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join(' / ')
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5"
        style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)', backdropFilter: 'blur(8px)' }}
        dir="ltr"
      >
        <span className="flex items-center justify-center w-5 h-5 rounded-md shrink-0" style={{ background: 'rgba(245,158,11,0.20)' }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="3" width="14" height="12" rx="2" stroke="#f59e0b" strokeWidth="1.5"/>
            <path d="M5 1v4M11 1v4M1 7h14" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </span>
        <span className="text-amber-300 font-bold text-xs leading-none" style={{ fontFamily: "'Courier New',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em' }}>
          {fmt}
        </span>
      </div>
    )
  })()

  const phonePills = [slide.phone, slide.phone2].filter(Boolean).map((ph, i) => (
    <a key={i} href={`tel:${ph}`}
      className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition-all hover:scale-105 active:scale-95"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)' }}
      dir="ltr"
    >
      <span className="flex items-center justify-center w-5 h-5 rounded-md shrink-0" style={{ background: 'rgba(255,255,255,0.10)' }}>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
          <path d="M2 3a1 1 0 011-1h2.5a1 1 0 011 1v1.5a1 1 0 01-.6.92l-.9.36a8 8 0 003.22 3.22l.36-.9A1 1 0 0110.5 7.5H12a1 1 0 011 1V11a1 1 0 01-1 1C6.48 12 2 7.52 2 3z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinejoin="round"/>
        </svg>
      </span>
      <span className="text-slate-200 font-semibold text-xs leading-none" style={{ fontFamily: "'Courier New',monospace", letterSpacing: '0.05em' }}>{ph}</span>
    </a>
  ))

  return (
    <section
      id="exclusive-section"
      className="relative h-[calc(100dvh-4rem)] md:h-screen overflow-hidden bg-slate-950"
      onMouseEnter={() => { pausedRef.current = true  }}
      onMouseLeave={() => { pausedRef.current = false }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{HERO_CSS}</style>

      {/* ══════════════════════════════════════════════
          LAYER 1 — Background crossfade + atmosphere
      ══════════════════════════════════════════════ */}
      <div className="absolute inset-0 z-0">
        {slides.map((s, i) => {
          const bgSrc = s.bg_image_url || s.image_url
          return (
            <div key={s.id} className="absolute inset-0 transition-opacity duration-700 ease-in-out" style={{ opacity: i === current ? 1 : 0 }}>
              {bgSrc
                ? <Image src={bgSrc} alt="" fill className="object-cover object-center" unoptimized priority={i === 0} sizes="100vw" />
                : <div className="absolute inset-0 bg-slate-900" />
              }
            </div>
          )
        })}

        {/* Directional gradient */}
        <div className="absolute inset-0" style={{
          background: isRtl
            ? 'linear-gradient(to left,  rgba(2,6,23,0.93) 0%, rgba(2,6,23,0.82) 36%, rgba(2,6,23,0.56) 62%, rgba(2,6,23,0.28) 100%)'
            : 'linear-gradient(to right, rgba(2,6,23,0.93) 0%, rgba(2,6,23,0.82) 36%, rgba(2,6,23,0.56) 62%, rgba(2,6,23,0.28) 100%)',
        }} />
        {/* Mobile scrim overlay — heavier for readability */}
        <div className="absolute inset-0 md:hidden" style={{ background: 'rgba(2,6,23,0.72)' }} />

        {/* Ambient glows */}
        <div className="absolute bottom-[-60px] left-[10%] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(185,28,28,0.20) 0%, transparent 68%)', animation: 'ambientDrift 9s ease-in-out infinite' }} />
        <div className="absolute top-[-40px] right-[8%] w-[260px] h-[260px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.11) 0%, transparent 68%)', animation: 'ambientDrift 11s ease-in-out infinite reverse' }} />

        {/* Dot-grid texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.65]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      {/* ══════════════════════════════════════════════
          LAYER 2 — Content (animated wrapper)
      ══════════════════════════════════════════════ */}
      <div className="relative z-10 h-full" key={animKey} dir={isRtl ? 'rtl' : 'ltr'}>

        {/* ╔══════════════════════════════════════════╗
            ║  MOBILE LAYOUT  (< md / below 768px)    ║
            ╚══════════════════════════════════════════╝ */}
        <div className="md:hidden h-full flex flex-col items-center px-4 py-5 max-w-md mx-auto">

          {/* 1 ── Hero image card — 9:16 portrait ratio */}
          <div className="relative shrink-0 mt-1 h-img w-[52%] sm:w-[48%] mx-auto aspect-[4/5]">
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <ImageCardInner slide={slide} current={current} total={slides.length} getText={getText} isRtl={isRtl} kuFont={kuFont} />
            </div>
            <MuseumPill musName={musName} kuFont={kuFont} />
          </div>

          {/* Gap that clears the museum pill (-bottom-3 = 12px) + breathing room */}
          <div className="h-5 shrink-0" />

          {/* 2 ── Centered content stack */}
          <div className="w-full flex-1 flex flex-col items-center justify-center gap-2 min-h-0" dir="ltr">

            {/* Category badge */}
            <div
              className="h-up d1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 mx-auto"
              style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.30)', backdropFilter: 'blur(8px)' }}
            >
              <span className="text-amber-400 font-black text-[9px]">✦</span>
              <span className="text-amber-300 font-bold uppercase tracking-[0.18em] text-[9px]" style={kuFont}>
                {lang === 'ku' ? 'چالاکی تایبەتی مۆزەخانە' : lang === 'ar' ? 'نشاط خاص' : 'Museum Exclusive'}
              </span>
            </div>

            {/* Headline */}
            <h2
              className="h-up d2 text-xl sm:text-2xl font-black text-white leading-snug text-center max-w-xs sm:max-w-sm mx-auto"
              style={{ ...kuFont, textShadow: '0 2px 18px rgba(0,0,0,0.6)' }}
            >
              {getText(slide, 'title')}
            </h2>

            {/* Description */}
            {getText(slide, 'description') && (
              <p className="h-up d3 text-xs text-slate-300/90 text-center line-clamp-2 max-w-xs mx-auto leading-relaxed" style={kuFont}>
                {getText(slide, 'description')}
              </p>
            )}

            {/* Countdown — full display, above date/phone */}
            {slide.countdown_to && !countdownDone && (
              <div className="h-up d3">
                <CountdownBadge targetTime={slide.countdown_to} lang={lang} kuFont={kuFont} onFinish={() => setCountdownDone(true)} />
              </div>
            )}

            {/* Date + phone row */}
            {(slide.event_date || slide.phone || slide.phone2) && (
              <div className="h-up d4 flex items-center justify-center gap-1.5 flex-wrap">
                {datePill}
                {phonePills}
              </div>
            )}

            {/* Primary CTA */}
            {slide.link && (
              <a
                href={slide.link}
                target="_blank"
                rel="noopener noreferrer"
                className="h-up d5 mx-auto inline-flex items-center justify-center gap-2 px-8 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all active:scale-95 hover:scale-105 shadow-lg"
                style={{ ...kuFont, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0c0a09', boxShadow: '0 6px 22px rgba(245,158,11,0.40)' }}
              >
                <span>🔗</span>
                <span>{lang === 'ku' ? 'زیاتر بزانە' : lang === 'ar' ? 'اعرف أكثر' : 'Learn More'}</span>
              </a>
            )}

          </div>

          {/* 3 ── Bottom spacer — room for the dot indicators (absolute bottom-3) */}
          <div className="h-8 shrink-0" />

        </div>
        {/* ╚══════ end mobile layout ══════╝ */}


        {/* ╔══════════════════════════════════════════════════════╗
            ║  TABLET / DESKTOP LAYOUT  (md+ / 768px and above)  ║
            ╚══════════════════════════════════════════════════════╝ */}
        <div className="hidden md:flex h-full flex-col">
          <div className="w-full max-w-7xl mx-auto px-6 lg:px-14 h-full flex flex-col lg:justify-center pt-10 pb-12 lg:py-0">

            <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-10 lg:items-center gap-3 lg:gap-0 flex-1 lg:flex-none min-h-0">

              {/* Image column */}
              <div className="order-first lg:order-last lg:col-span-5 flex items-center justify-center shrink-0 lg:shrink h-img d3 pb-6 lg:pb-0">
                <div className="relative w-full max-w-[260px] md:max-w-[300px] lg:max-w-[340px] mx-auto aspect-[4/5]">
                  <div className="absolute inset-0 rounded-2xl lg:rounded-3xl overflow-hidden">
                    {/* Ambient glow — desktop only */}
                    <div className="hidden lg:block absolute -inset-6 pointer-events-none"
                      style={{ background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.13) 0%, transparent 68%)', filter: 'blur(20px)' }} />
                    <ImageCardInner slide={slide} current={current} total={slides.length} getText={getText} isRtl={isRtl} kuFont={kuFont} />
                  </div>
                  {/* Museum pill */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-900/90 text-white px-4 py-1.5 rounded-full border border-white/20 shadow-xl backdrop-blur-md text-xs sm:text-sm font-medium whitespace-nowrap max-w-[90vw]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/android-chrome-192x192.png" alt="" className="w-5 h-5 rounded object-contain shrink-0" />
                    <span style={kuFont}>مۆزەخانەی نیشتمانیی ئەمنە سوورەکە</span>
                  </div>
                </div>
              </div>

              {/* Text column */}
              <div className={`order-last lg:order-first lg:col-span-7 flex flex-col gap-3 lg:gap-4 min-h-0 items-start ${isRtl ? 'text-right' : ''}`}>

                {/* Badge */}
                <div className="h-up d1 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 shrink-0"
                  style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.28)', backdropFilter: 'blur(8px)' }}>
                  <span className="text-amber-400 font-black text-[9px]">✦</span>
                  <span className="text-amber-300 font-bold uppercase tracking-[0.2em] text-[10px]" style={kuFont}>
                    {lang === 'ku' ? 'چالاکی تایبەتی مۆزەخانە' : lang === 'ar' ? 'نشاط خاص' : 'Museum Exclusive'}
                  </span>
                </div>

                {/* Headline */}
                <h2 className="h-up d2 text-3xl lg:text-5xl xl:text-[3.2rem] font-black leading-tight text-white shrink-0"
                  style={{ ...kuFont, textShadow: '0 2px 20px rgba(0,0,0,0.55)' }}>
                  {getText(slide, 'title')}
                </h2>

                {/* Description */}
                {getText(slide, 'description') && (
                  <p className="h-up d3 text-slate-300/90 text-sm lg:text-base leading-relaxed line-clamp-3 shrink-0" style={kuFont}>
                    {getText(slide, 'description')}
                  </p>
                )}

                {/* Meta pills */}
                {(slide.event_date || slide.phone || slide.phone2) && (
                  <div className="h-up d3 flex flex-wrap items-center gap-2 shrink-0">
                    {datePill}
                    {phonePills}
                  </div>
                )}

                {/* Countdown */}
                {slide.countdown_to && !countdownDone && (
                  <div className="h-up d4 shrink-0">
                    <CountdownBadge targetTime={slide.countdown_to} lang={lang} kuFont={kuFont} onFinish={() => setCountdownDone(true)} />
                  </div>
                )}

                {/* CTAs */}
                <div className={`h-up d5 flex flex-wrap items-center gap-3 shrink-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  {slide.link && (
                    <a href={slide.link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-sm transition-all hover:scale-105 active:scale-95"
                      style={{ ...kuFont, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0c0a09', boxShadow: '0 6px 22px rgba(245,158,11,0.36)' }}>
                      <span>🔗</span>
                      <span>{lang === 'ku' ? 'زیاتر بزانە' : lang === 'ar' ? 'اعرف أكثر' : 'Learn More'}</span>
                    </a>
                  )}
                </div>

              </div>{/* /text column */}
            </div>
          </div>
        </div>
        {/* ╚══════ end tablet/desktop layout ══════╝ */}

      </div>

      {/* ══════════════════════════════════════════════
          LAYER 3 — Interactive controls  z-20
          Arrows: hidden on mobile (hidden md:flex in ArrowBtn)
      ══════════════════════════════════════════════ */}
      {slides.length > 1 && (
        <>
          <ArrowBtn onClick={() => goTo(current - 1)} dir="prev" />
          <ArrowBtn onClick={() => goTo(current + 1)} dir="next" />
        </>
      )}

      {/* Pill indicators — centered bottom */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2">
          {slides.map((s, i) => (
            <button key={s.id} onClick={() => goTo(i)}
              className="rounded-full h-2 transition-all duration-300"
              style={{
                width: i === current ? '1.75rem' : '0.5rem',
                background: i === current ? '#f59e0b' : 'rgba(255,255,255,0.35)',
                boxShadow: i === current ? '0 0 10px rgba(245,158,11,0.5)' : 'none',
              }}
            />
          ))}
        </div>
      )}

      {/* Progress rail */}
      {slides.length > 1 && (
        <div className="absolute bottom-0 inset-x-0 z-20 h-[3px] bg-white/10">
          <div className="h-full bg-amber-400" style={{ width: `${progress}%`, transition: `width ${TICK_MS}ms linear` }} />
        </div>
      )}

    </section>
  )
}
