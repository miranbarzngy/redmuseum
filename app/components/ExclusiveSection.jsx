'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '../lib/supabase-client'
import Image from 'next/image'

const SLIDE_DURATION = 7000

function DateDisplay({ dateStr, lang }) {
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = String(d.getFullYear())

  const label = lang === 'ku' ? 'بەروار' : lang === 'ar' ? 'التاريخ' : 'DATE'

  return (
    <div className="flex flex-col items-center mt-3" dir="ltr">
      <div className="relative rounded-md overflow-hidden h-16 md:h-20 flex items-center px-5 gap-3">
        {/* Single shared background — top/bottom halves */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-[#1a1a1a]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#111111]" />
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-black z-10" />
        {/* Content */}
        <span className="relative z-20 text-white font-mono font-bold text-2xl md:text-3xl tabular-nums">{dd}</span>
        <span className="relative z-20 text-white/50 font-bold text-xl select-none">/</span>
        <span className="relative z-20 text-white font-mono font-bold text-2xl md:text-3xl tabular-nums">{mm}</span>
        <span className="relative z-20 text-white/50 font-bold text-xl select-none">/</span>
        <span className="relative z-20 text-white font-mono font-bold text-2xl md:text-3xl tabular-nums">{yyyy}</span>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-[#c8a96e] font-medium mt-2">{label}</span>
    </div>
  )
}

// Flip animation styles injected once
const flipStyles = `
  .flip-card { perspective: 400px; }
  .flip-top {
    position: absolute; top: 0; left: 0; right: 0; height: 50%;
    background: #1a1a1a; border-radius: 6px 6px 0 0;
    overflow: hidden; transform-origin: bottom;
    backface-visibility: hidden;
    display: flex; align-items: flex-end; justify-content: center;
  }
  .flip-bottom {
    position: absolute; bottom: 0; left: 0; right: 0; height: 50%;
    background: #111111; border-radius: 0 0 6px 6px;
    overflow: hidden; transform-origin: top;
    backface-visibility: hidden;
    display: flex; align-items: flex-start; justify-content: center;
  }
  .flip-top span { transform: translateY(50%); }
  .flip-bottom span { transform: translateY(-50%); }

  /* Flap that animates — top half folding down */
  .flip-flap {
    position: absolute; top: 0; left: 0; right: 0; height: 50%;
    background: #1a1a1a; border-radius: 6px 6px 0 0;
    overflow: hidden; transform-origin: bottom;
    animation: flipDown 0.45s ease-in-out forwards;
    z-index: 30;
    display: flex; align-items: flex-end; justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.6);
  }
  .flip-flap span { transform: translateY(50%); }

  @keyframes flipDown {
    0%   { transform: rotateX(0deg); }
    100% { transform: rotateX(-90deg); }
  }

  /* Bottom reveal that appears after flap passes */
  .flip-reveal {
    position: absolute; bottom: 0; left: 0; right: 0; height: 50%;
    background: #111111; border-radius: 0 0 6px 6px;
    overflow: hidden; transform-origin: top;
    animation: flipReveal 0.45s ease-in-out forwards;
    z-index: 25;
    display: flex; align-items: flex-start; justify-content: center;
  }
  .flip-reveal span { transform: translateY(-50%); }

  @keyframes flipReveal {
    0%   { transform: rotateX(90deg); }
    100% { transform: rotateX(0deg); }
  }

  /* Center divider */
  .flip-divider {
    position: absolute; top: 50%; left: 0; right: 0;
    height: 2px; background: black; z-index: 40;
    transform: translateY(-50%);
  }
`

function FlipCard({ value }) {
  const [display, setDisplay] = useState(value)
  const [next, setNext] = useState(value)
  const [flipping, setFlipping] = useState(false)

  useEffect(() => {
    if (value === display) return
    setNext(value)
    setFlipping(true)
    const t = setTimeout(() => {
      setDisplay(value)
      setFlipping(false)
    }, 450)
    return () => clearTimeout(t)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const size = 'w-24 h-28 md:w-32 md:h-36'
  const textSize = 'text-5xl md:text-6xl'

  return (
    <div className={`relative ${size} flip-card`} style={{ perspective: 400 }}>
      {/* Static bottom half — shows current value */}
      <div className="flip-bottom">
        <span className={`text-white font-mono ${textSize} font-bold tabular-nums`}>{display}</span>
      </div>
      {/* Static top half — shows current value */}
      <div className="flip-top">
        <span className={`text-white font-mono ${textSize} font-bold tabular-nums`}>{display}</span>
      </div>

      {flipping && <>
        {/* Animated flap — old value folding down */}
        <div className="flip-flap">
          <span className={`text-white font-mono ${textSize} font-bold tabular-nums`}>{display}</span>
        </div>
        {/* Bottom reveal — new value rotating up */}
        <div className="flip-reveal">
          <span className={`text-white font-mono ${textSize} font-bold tabular-nums`}>{next}</span>
        </div>
        {/* New top — shown after flip */}
        <div className="flip-top" style={{ zIndex: 20 }}>
          <span className={`text-white font-mono ${textSize} font-bold tabular-nums`}>{next}</span>
        </div>
      </>}

      <div className="flip-divider" />
    </div>
  )
}

function Countdown({ targetTime, lang }) {
  const [parts, setParts] = useState({ d: '--', h: '--', m: '--', s: '--' })

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetTime) - new Date()
      if (diff <= 0) {
        setParts({ d: '00', h: '00', m: '00', s: '00' })
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
    : ['DAYS', 'HOURS', 'MINUTES', 'SECONDS']

  const units = [parts.d, parts.h, parts.m, parts.s]

  return (
    <>
      <style>{flipStyles}</style>
      <div className="flex items-center gap-2 md:gap-4" dir="ltr">
        {units.map((val, i) => (
          <div key={i} className="flex items-center gap-2 md:gap-4">
            <div className="flex flex-col items-center gap-3">
              <FlipCard value={val} />
              <span className="text-xs md:text-sm uppercase tracking-widest text-[#c8a96e] font-semibold">{labels[i]}</span>
            </div>
            {i < 3 && (
              <span className="text-white/60 font-bold text-4xl md:text-5xl mb-8 select-none">:</span>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

export default function ExclusiveSection({ currentLang = 'ku' }) {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)

  const lang = currentLang === 'ku' ? 'ku' : currentLang === 'ar' ? 'ar' : 'en'
  const isRtl = lang === 'ku' || lang === 'ar'

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

    const channel = supabase
      .channel('exclusive-section-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exclusive_slides' }, fetchSlides)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exclusive_events' }, fetchSlides)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchSlides])

  // Auto-advance — stops when current slide is locked
  useEffect(() => {
    if (slides.length <= 1) return
    if (slides[current]?.is_locked) return
    const id = setInterval(() => setCurrent(p => (p + 1) % slides.length), SLIDE_DURATION)
    return () => clearInterval(id)
  }, [slides, current])

  if (loading) {
    return (
      <section id="exclusive-section" className="py-20 bg-black flex items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </section>
    )
  }

  if (slides.length === 0) return null

  const slide = slides[current]

  return (
    <section id="exclusive-section" className="relative bg-black text-white overflow-hidden min-h-screen">

      {/* Background image */}
      {slide.image_url && (
        <div className="absolute inset-0">
          <Image
            src={slide.image_url}
            alt=""
            fill
            className="object-cover opacity-25 transition-opacity duration-1000"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
        </div>
      )}
      {!slide.image_url && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-black to-black" />
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 min-h-screen flex flex-col justify-center">

        {/* Section label */}
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.3em] text-red-400 bg-red-600/10 border border-red-600/30 px-4 py-1.5 rounded-full mb-5">
            ⭐&nbsp;{lang === 'ku' ? 'تایبەت' : lang === 'ar' ? 'حصري' : 'Exclusive'}
          </span>
          <h2
            className="text-4xl md:text-5xl font-bold leading-tight"
            style={{ fontFamily: lang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : 'inherit' }}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {getText(slide, 'title')}
          </h2>
          <div className="w-20 h-1 bg-red-600 mx-auto mt-5" />
        </div>

        {/* Content grid */}
        <div className="grid md:grid-cols-2 gap-10 items-center">

          {/* Info side */}
          <div className="space-y-6 order-2 md:order-1" dir={isRtl ? 'rtl' : 'ltr'}>


            {/* Description */}
            {getText(slide, 'description') && (
              <p
                className="text-gray-300 text-lg leading-relaxed"
                style={{ fontFamily: lang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : 'inherit' }}
              >
                {getText(slide, 'description')}
              </p>
            )}

            {/* Phone numbers */}
            <div className="space-y-2">
              {slide.phone && (
                <a
                  href={`tel:${slide.phone}`}
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors w-fit"
                  dir="ltr"
                >
                  <span className="text-red-500">📞</span>
                  <span className="font-mono">{slide.phone}</span>
                </a>
              )}
              {slide.phone2 && (
                <a
                  href={`tel:${slide.phone2}`}
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors w-fit"
                  dir="ltr"
                >
                  <span className="text-red-500">📞</span>
                  <span className="font-mono">{slide.phone2}</span>
                </a>
              )}
            </div>

            {/* Countdown */}
            {slide.countdown_to && (
              <div className="flex flex-col items-center">
                <p className="text-gray-400 text-sm mb-3 text-center w-full"
                  style={{ fontFamily: lang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : 'inherit' }}>
                  {lang === 'ku' ? 'کاتژمێر بۆ دەستپێکردن' : lang === 'ar' ? 'العد التنازلي للبدء' : 'Countdown to start'}
                </p>
                <Countdown targetTime={slide.countdown_to} lang={lang} />
                {slide.event_date && <DateDisplay dateStr={slide.event_date} lang={lang} />}
              </div>
            )}

            {/* Date fallback — only shown when there is no countdown */}
            {!slide.countdown_to && slide.event_date && (
              <div className="flex justify-center">
                <DateDisplay dateStr={slide.event_date} lang={lang} />
              </div>
            )}

            {/* Link */}
            {slide.link && (
              <a
                href={slide.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition-colors shadow-lg"
              >
                🔗&nbsp;{lang === 'ku' ? 'بڕۆ بۆ گەڕان' : lang === 'ar' ? 'زيارة الرابط' : 'Visit Link'}
              </a>
            )}

          </div>

          {/* Image side */}
          <div className="relative h-72 md:h-[60vh] lg:h-[70vh] rounded-2xl overflow-hidden order-1 md:order-2">
            {slide.image_url ? (
              <Image
                src={slide.image_url}
                alt={getText(slide, 'title')}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 to-black/60 flex items-center justify-center rounded-2xl border border-red-600/20">
                <span className="text-8xl opacity-20">⭐</span>
              </div>
            )}
          </div>
        </div>

        {/* Slide dots */}
        {slides.length > 1 && (
          <div className="flex justify-center gap-2 mt-12">
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
      </div>
    </section>
  )
}
