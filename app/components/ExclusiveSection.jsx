'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseClient } from '../lib/supabase-client'
import { useMuseumName } from '../lib/useMuseumName'
import Image from 'next/image'

const SLIDE_DURATION = 7000

function DateDisplay({ dateStr, lang }) {
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = String(d.getFullYear())

  const label = lang === 'ku' ? 'بەروار' : lang === 'ar' ? 'التاريخ' : 'DATE'

  return (
    <div className="flex flex-col items-center py-1" dir="ltr">
      <div className="flex items-center gap-1.5">
        {[yyyy, mm, dd].map((part, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span
              className="flip-digit text-white font-bold tracking-widest"
              style={{
                ...DIGIT_STYLE,
                fontSize: '18px',
                textShadow: '0 0 12px rgba(200,169,110,0.4)',
              }}
              lang="en"
            >
              {part}
            </span>
            {i < 2 && (
              <span
                className="text-[#c8a96e]/60 font-bold select-none"
                style={{ fontSize: '16px' }}
              >
                /
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Flip animation styles injected once
const flipStyles = `
  .flip-card { perspective: 600px; }

  .flip-top {
    position: absolute; top: 0; left: 0; right: 0; height: 50%;
    background: linear-gradient(180deg, #1a0000 0%, #8b0000 50%, #cc0000 100%);
    border-radius: 10px 10px 0 0;
    overflow: hidden; transform-origin: bottom;
    backface-visibility: hidden;
    display: flex; align-items: flex-end; justify-content: center;
    border: 1px solid rgba(255,160,0,0.18);
    border-bottom: none;
  }
  .flip-top::after {
    content: '';
    position: absolute; inset-x-0; top: 0; height: 35%;
    background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%);
    border-radius: 10px 10px 0 0;
  }

  .flip-bottom {
    position: absolute; bottom: 0; left: 0; right: 0; height: 50%;
    background: linear-gradient(180deg, #cc0000 0%, #8b0000 50%, #2a0000 100%);
    border-radius: 0 0 10px 10px;
    overflow: hidden; transform-origin: top;
    backface-visibility: hidden;
    display: flex; align-items: flex-start; justify-content: center;
    border: 1px solid rgba(255,160,0,0.18);
    border-top: none;
  }

  .flip-top span { transform: translateY(50%); }
  .flip-bottom span { transform: translateY(-50%); }

  /* Flap that animates — top half folding down */
  .flip-flap {
    position: absolute; top: 0; left: 0; right: 0; height: 50%;
    background: linear-gradient(180deg, #1a0000 0%, #8b0000 50%, #cc0000 100%);
    border-radius: 10px 10px 0 0;
    overflow: hidden; transform-origin: bottom;
    animation: flipDown 0.45s ease-in-out forwards;
    z-index: 30;
    display: flex; align-items: flex-end; justify-content: center;
    box-shadow: 0 8px 24px rgba(0,0,0,0.7), 0 2px 8px rgba(200,0,0,0.4);
    border: 1px solid rgba(255,160,0,0.18); border-bottom: none;
  }
  .flip-flap span { transform: translateY(50%); }

  @keyframes flipDown {
    0%   { transform: rotateX(0deg); }
    100% { transform: rotateX(-90deg); }
  }

  /* Bottom reveal that appears after flap passes */
  .flip-reveal {
    position: absolute; bottom: 0; left: 0; right: 0; height: 50%;
    background: linear-gradient(180deg, #cc0000 0%, #8b0000 50%, #2a0000 100%);
    border-radius: 0 0 10px 10px;
    overflow: hidden; transform-origin: top;
    animation: flipReveal 0.45s ease-in-out forwards;
    z-index: 25;
    display: flex; align-items: flex-start; justify-content: center;
    border: 1px solid rgba(255,160,0,0.18); border-top: none;
  }
  .flip-reveal span { transform: translateY(-50%); }

  @keyframes flipReveal {
    0%   { transform: rotateX(90deg); }
    100% { transform: rotateX(0deg); }
  }

  /* Center divider */
  .flip-divider {
    position: absolute; top: 50%; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(0,0,0,0.7) 20%, rgba(0,0,0,0.7) 80%, transparent);
    z-index: 40;
    transform: translateY(-50%);
  }

  /* Pulsing colon */
  @keyframes colonPulse {
    0%, 100% { opacity: 0.9; transform: scale(1) translateY(-12px); }
    50%       { opacity: 0.35; transform: scale(0.85) translateY(-12px); }
  }
  .colon-pulse { animation: colonPulse 1s ease-in-out infinite; }

  /* Force Western digits — overrides any locale/font substitution */
  .flip-digit {
    font-family: 'Courier New', 'Lucida Console', 'Courier', monospace !important;
    direction: ltr !important;
    unicode-bidi: embed !important;
    font-variant-numeric: tabular-nums !important;
    font-feature-settings: 'tnum' 1 !important;
  }

  @keyframes bgFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`

const DIGIT_STYLE = {
  fontFamily: "'Courier New', 'Lucida Console', 'Courier', monospace",
  direction: 'ltr',
  unicodeBidi: 'isolate',
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: "'tnum' 1",
}

// Shared sizing — used by both FlipCard and Countdown's separator wrapper
const CARD_W = 'clamp(28px, calc((100vw - 140px) / 8), 58px)'
const CARD_H = 'clamp(34px, calc((100vw - 140px) / 7), 70px)'
const NUM_FS = 'clamp(10px, calc((100vw - 140px) / 19), 24px)'

function FlipCard({ value }) {
  const [display, setDisplay] = useState(value)
  const [next, setNext]       = useState(value)
  const [flipping, setFlipping] = useState(false)

  useEffect(() => {
    if (value === display) return
    setNext(value)
    setFlipping(true)
    const t = setTimeout(() => { setDisplay(value); setFlipping(false) }, 450)
    return () => clearTimeout(t)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const cardW = CARD_W
  const cardH = CARD_H
  const numFs = NUM_FS
  const spanSt = { ...DIGIT_STYLE, fontSize: numFs }

  return (
    <div
      className="relative flip-card"
      style={{
        width: cardW, height: cardH,
        perspective: 600,
        filter: 'drop-shadow(0 6px 18px rgba(180,0,0,0.55)) drop-shadow(0 2px 6px rgba(0,0,0,0.7))',
      }}
    >
      <div className="flip-bottom">
        <span className="flip-digit text-white font-bold" style={spanSt} lang="en">{display}</span>
      </div>
      <div className="flip-top">
        <span className="flip-digit text-white font-bold" style={spanSt} lang="en">{display}</span>
      </div>

      {flipping && <>
        <div className="flip-flap">
          <span className="flip-digit text-white font-bold" style={spanSt} lang="en">{display}</span>
        </div>
        <div className="flip-reveal">
          <span className="flip-digit text-white font-bold" style={spanSt} lang="en">{next}</span>
        </div>
        <div className="flip-top" style={{ zIndex: 20 }}>
          <span className="flip-digit text-white font-bold" style={spanSt} lang="en">{next}</span>
        </div>
      </>}

      <div className="flip-divider" />
    </div>
  )
}

function Countdown({ targetTime, lang, onFinish }) {
  const [parts, setParts] = useState({ d: '--', h: '--', m: '--', s: '--' })
  const finishedRef = useRef(false)

  useEffect(() => {
    finishedRef.current = false
    const calc = () => {
      const diff = new Date(targetTime) - new Date()
      if (diff <= 0) {
        setParts({ d: '00', h: '00', m: '00', s: '00' })
        if (!finishedRef.current) {
          finishedRef.current = true
          onFinish?.()
        }
        return
      }
      setParts({
        d: String(Math.floor(diff / 86400000)).padStart(2, '0'),
        h: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
        s: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [targetTime])

  const labels = lang === 'ku'
    ? ['ڕۆژ', 'کاتژمێر', 'خولەک', 'چرکە']
    : lang === 'ar'
    ? ['يوم', 'ساعة', 'دقيقة', 'ثانية']
    : ['DAYS', 'HOURS', 'MINS', 'SECS']

  const units = [parts.d, parts.h, parts.m, parts.s]

  // Tighter gaps so 4 cards + 3 separators fit in the ~440px half-column at lg
  const itemGap = 'clamp(3px, 1vw, 13px)'
  const dotSize = 'clamp(3px, 0.7vw, 7px)'
  const dotGap  = 'clamp(2px, 0.5vw, 6px)'

  return (
    <>
      <style>{flipStyles}</style>
      <div
        className="relative rounded-2xl w-full"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(120,0,0,0.25) 0%, transparent 75%)',
          padding: 'clamp(10px, 2.5vw, 28px) clamp(6px, 1.5vw, 32px)',
        }}
      >
        {/* dir="ltr" ensures Days is always on the LEFT regardless of page RTL */}
        <div
          className="flex items-center justify-center flex-nowrap"
          style={{ gap: itemGap, direction: 'ltr' }}
        >
          {units.map((val, i) => (
            <div key={i} className="flex items-start flex-nowrap" style={{ gap: itemGap }}>
              <div className="flex flex-col items-center" style={{ gap: 'clamp(4px, 0.8vw, 10px)' }}>
                <FlipCard value={val} />
                <div className="flex flex-col items-center" style={{ gap: '2px' }}>
                  <div className="w-5 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/60 to-transparent" />
                  <span
                    className="font-bold text-[#c8a96e] uppercase"
                    style={{
                      fontSize: 'clamp(7px, 1.4vw, 12px)',
                      letterSpacing: '0.12em',
                      fontFamily: lang === 'ku' || lang === 'ar' ? 'UniSalar, Tahoma, sans-serif' : 'inherit',
                      textShadow: '0 0 10px rgba(200,169,110,0.5)',
                    }}
                  >
                    {labels[i]}
                  </span>
                </div>
              </div>

              {i < 3 && (
                /* Wrapper is exactly CARD_H tall; dots are absolutely centred inside it */
                <div style={{ position: 'relative', height: CARD_H, width: dotSize, flexShrink: 0 }}>
                  <div
                    className="colon-pulse flex flex-col"
                    style={{
                      gap: dotGap,
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      transform: 'translateY(-50%)',
                    }}
                  >
                    <span className="rounded-full bg-[#c8a96e] block" style={{ width: dotSize, height: dotSize, boxShadow: '0 0 6px rgba(200,169,110,0.8)' }} />
                    <span className="rounded-full bg-[#c8a96e] block" style={{ width: dotSize, height: dotSize, boxShadow: '0 0 6px rgba(200,169,110,0.8)' }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default function ExclusiveSection({ currentLang = 'ku' }) {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [displayed, setDisplayed] = useState(0)
  const [fading, setFading] = useState(false)
  const [countdownDone, setCountdownDone] = useState(false)
  const [bgColor, setBgColor] = useState('#000000')

  const museumName = useMuseumName()

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase?.from('settings').select('exclusive_bg_color').single()
      .then(({ data }) => { if (data?.exclusive_bg_color) setBgColor(data.exclusive_bg_color) })
  }, [])

  const lang = currentLang === 'ku' ? 'ku' : currentLang === 'ar' ? 'ar' : 'en'
  const isRtl = lang === 'ku' || lang === 'ar'
  const museumNameDisplay = lang === 'ar' ? museumName.ar : lang === 'ku' ? museumName.kr : museumName.en

  const getText = (slide, field) =>
    slide[`${field}_${lang}`] || slide[`${field}_en`] || ''

  const fetchSlides = useCallback(async () => {
    const supabase = getSupabaseClient()
    if (!supabase) { setLoading(false); return }
    try {
      const { data } = await supabase
        .from('exclusive_slides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      setSlides(data || [])
    } catch (err) {
      console.error('ExclusiveSection fetch error:', err.message || err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) { setLoading(false); return }

    fetchSlides()

    return () => {}
  }, [fetchSlides])

  // Auto-advance — stops when current slide is locked
  useEffect(() => {
    if (slides.length <= 1) return
    if (slides[current]?.is_locked) return
    const id = setInterval(() => setCurrent(p => (p + 1) % slides.length), SLIDE_DURATION)
    return () => clearInterval(id)
  }, [slides, current])

  // Fade-transition when current changes
  useEffect(() => {
    if (current === displayed) return
    setFading(true)
    const t = setTimeout(() => { setDisplayed(current); setFading(false) }, 350)
    return () => clearTimeout(t)
  }, [current]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset countdownDone when displayed slide changes; pre-check if already expired
  useEffect(() => {
    const slide = slides[displayed]
    if (!slide?.countdown_to) { setCountdownDone(false); return }
    setCountdownDone(new Date(slide.countdown_to) <= new Date())
  }, [displayed, slides])

  if (loading) {
    return (
      <section id="exclusive-section" className="py-20 flex items-center justify-center min-h-[300px]" style={{ background: bgColor }}>
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </section>
    )
  }

  if (slides.length === 0) return null

  const slide = slides[displayed]

  return (
    <section id="exclusive-section" className="relative text-white overflow-hidden" style={{ background: bgColor, minHeight: '35svh' }}>

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-black to-black" />

      {/* Fade wrapper */}
      <div
        className="relative z-10"
        style={{
          opacity: fading ? 0 : 1,
          transform: fading ? 'translateY(12px)' : 'translateY(0)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
        }}
      >

      {/* Title — full width, truly centered */}
      <div className="text-center pt-8 pb-4 px-4">
        <span className="inline-block text-xs font-bold uppercase tracking-[0.3em] text-red-400 bg-red-600/10 border border-red-600/30 px-4 py-1.5 rounded-full mb-4">
          ⭐&nbsp;{lang === 'ku' ? 'چالاکییەکانی مۆزەخانە' : lang === 'ar' ? 'أنشطة المتحف' : 'Museum Activities'}
        </span>
        <h2
          className="text-2xl md:text-4xl lg:text-4xl font-bold leading-tight"
          style={{ fontFamily: lang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : 'inherit' }}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {getText(slide, 'title')}
        </h2>
        <div className="w-20 h-1 bg-red-600 mx-auto mt-4" />
      </div>

      {/* Split layout — grid */}
      <div className="max-w-screen-2xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[60%_40%] lg:items-start">

        {/* IMAGE — col 1 = RIGHT in RTL, stacks on top on mobile */}
        <div className="w-full flex items-center justify-center p-3 pt-5 lg:p-3 xl:p-4 lg:self-center">
          <div
            className="relative rounded-2xl overflow-hidden w-full"
            style={{
              aspectRatio: '16/9',
              border: '1.5px solid rgba(200,169,110,0.5)',
              boxShadow: '0 0 0 4px rgba(200,169,110,0.06), 0 24px 80px rgba(0,0,0,0.85)',
            }}
          >
            {slide.image_url ? (
              <Image
                src={slide.image_url}
                alt={getText(slide, 'title')}
                fill
                className="object-cover object-center"
                unoptimized
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 to-black/60 flex items-center justify-center">
                <span className="text-8xl opacity-20">⭐</span>
              </div>
            )}

            {/* Bottom gradient for logo readability */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />

            {/* Museum logo watermark — bottom left */}
            <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/android-chrome-192x192.png"
                alt=""
                className="w-8 h-8 rounded-lg object-cover bg-white p-0.5 shrink-0"
                style={{ border: '1px solid rgba(200,169,110,0.4)' }}
              />
              <div>
                <p className="text-[8px] text-[#c8a96e]/70 uppercase tracking-[0.15em] leading-none mb-0.5">
                  {museumName.en}
                </p>
                <p className="text-white text-[10px] font-semibold leading-tight" style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}>
                  {museumNameDisplay}
                </p>
              </div>
            </div>

            {/* Top gold shimmer */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/60 to-transparent" />
            {/* Bottom gold shimmer */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/40 to-transparent" />
          </div>
        </div>

        {/* CARD SIDE — col 2 = LEFT in RTL */}
        <div
          className="w-full px-4 md:px-6 lg:pl-8 lg:pr-8 pt-6 pb-8 lg:pt-8 lg:pb-8 flex flex-col overflow-y-auto"
        >
          {/* Invitation card */}
          <div
            className="flex-1 relative rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: 'linear-gradient(160deg, #0d0000 0%, #180000 50%, #0a0a0a 100%)',
              border: '1px solid rgba(200,169,110,0.2)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Top gold highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/50 to-transparent" />

            {/* Museum header */}
            <div
              className="px-5 pt-5 pb-3"
              style={{ background: 'linear-gradient(180deg, rgba(100,0,0,0.35) 0%, transparent 100%)' }}
            >
              <div className="flex items-center gap-3" dir="ltr">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/android-chrome-192x192.png"
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover shrink-0 bg-white p-0.5"
                  style={{ border: '1px solid rgba(200,169,110,0.3)' }}
                />
                <div className={isRtl ? 'text-right flex-1' : 'flex-1'}>
                  <p className="text-[9px] text-[#c8a96e]/60 uppercase tracking-[0.25em] leading-none mb-1">
                    {museumName.en}
                  </p>
                  <p
                    className="text-sm text-white/90 font-semibold leading-snug"
                    style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}
                  >
                    {museumNameDisplay}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/40 to-transparent" />
            </div>

            {/* Title in gold */}
            <div className="px-5 pt-4 pb-3">
              <p
                className="text-[#c8a96e] text-lg font-bold leading-snug"
                style={{
                  fontFamily: lang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : 'inherit',
                  textShadow: '0 0 20px rgba(200,169,110,0.35)',
                }}
              >
                {getText(slide, 'title')}
              </p>
              <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/30 to-transparent" />
            </div>

            {/* Description */}
            {getText(slide, 'description') && (
              <div className="px-5 pb-4 flex-1">
                <p
                  className="text-gray-300 text-sm md:text-base leading-loose"
                  style={{ fontFamily: lang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : 'inherit' }}
                >
                  {getText(slide, 'description')}
                </p>
              </div>
            )}

            {/* Phone numbers */}
            {(slide.phone || slide.phone2) && (
              <div className="px-5 pb-4 space-y-2">
                <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-2" />
                {slide.phone && (
                  <a href={`tel:${slide.phone}`} className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors w-fit" dir="rtl">
                    <span className="w-7 h-7 rounded-full bg-red-900/60 border border-red-700/40 flex items-center justify-center text-xs shrink-0">📞</span>
                    <span style={{ fontFamily: "'Courier New', Courier, monospace" }}>{slide.phone}</span>
                  </a>
                )}
                {slide.phone2 && (
                  <a href={`tel:${slide.phone2}`} className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors w-fit" dir="rtl">
                    <span className="w-7 h-7 rounded-full bg-red-900/60 border border-red-700/40 flex items-center justify-center text-xs shrink-0">📞</span>
                    <span style={{ fontFamily: "'Courier New', Courier, monospace" }}>{slide.phone2}</span>
                  </a>
                )}
              </div>
            )}

            {/* Countdown */}
            {slide.countdown_to && !countdownDone && (
              <div className="px-5 pb-4 flex flex-col items-center">
                <div className="flex items-center gap-3 mb-3 w-full">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#c8a96e]/30" />
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c8a96e]"
                    style={{
                      fontFamily: lang === 'ku' || lang === 'ar' ? 'UniSalar, Tahoma, sans-serif' : 'inherit',
                      textShadow: '0 0 14px rgba(200,169,110,0.5)',
                    }}
                  >
                    {lang === 'ku' ? 'کاتژمێر بۆ دەستپێکردن' : lang === 'ar' ? 'العد التنازلي للبدء' : 'Countdown to Start'}
                  </p>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#c8a96e]/30" />
                </div>
                <Countdown targetTime={slide.countdown_to} lang={lang} onFinish={() => setCountdownDone(true)} />
              </div>
            )}

            {/* Event poster */}
            {slide.event_date && (
              <div
                className="mx-3 mb-3 rounded-lg overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #5a0000 0%, #3a0000 100%)',
                  border: '1px solid rgba(200,169,110,0.25)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                }}
              >
                <div
                  className={`px-4 py-1 flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                  style={{ background: 'rgba(0,0,0,0.25)' }}
                >
                  <span className="text-[10px] text-[#c8a96e]/70 uppercase tracking-[0.2em]"
                    style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}>
                    {lang === 'ku' ? 'بەروار' : lang === 'ar' ? 'التاريخ' : 'Date'}
                  </span>
                  <div className="flex-1 h-px bg-[#c8a96e]/20" />
                </div>
                <div className="px-4 pb-3 pt-2 flex justify-center">
                  <DateDisplay dateStr={slide.event_date} lang={lang} />
                </div>
              </div>
            )}

            {/* Link button */}
            {slide.link && (
              <div className="px-5 pb-5">
                <a
                  href={slide.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-full transition-all shadow-lg border border-red-600/30 w-full"
                  style={{ fontFamily: lang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : 'inherit' }}
                >
                  🔗&nbsp;{lang === 'ku' ? 'لینک' : lang === 'ar' ? 'زيارة الرابط' : 'Visit Link'}
                </a>
              </div>
            )}

            {/* Gold bottom bar */}
            <div className="h-1.5 bg-gradient-to-r from-[#c8a96e] via-[#7a0000] to-[#c8a96e]" />
          </div>{/* end invitation card */}

          {/* Slide dots */}
          {slides.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current ? 'bg-red-600 w-6' : 'bg-white/30 hover:bg-white/60 w-2'
                  }`}
                />
              ))}
            </div>
          )}

        </div>{/* end card side */}

      </div>{/* end split layout */}
      </div>{/* end fade wrapper */}
    </section>
  )
}
