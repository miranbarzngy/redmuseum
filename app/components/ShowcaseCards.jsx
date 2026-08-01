'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { getSupabaseClient } from '../lib/supabase-client'

const INTERVAL = 5000
const TICK_MS  = 50

function getTitle(card, lang) {
  if (lang === 'ku' && card.title_ku) return card.title_ku
  if (lang === 'ar' && card.title_ar) return card.title_ar
  if (lang === 'en' && card.title_en) return card.title_en
  return card.title_ku || card.title_en || card.title_ar || ''
}

const SHOWCASE_CSS = `
  @keyframes scFadeUp {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes scCardIn {
    0%   { transform: scale(0.86); opacity: 0.4; filter: blur(2px); }
    55%  { transform: scale(1.04); opacity: 1;   filter: blur(0px); }
    80%  { transform: scale(0.98); }
    100% { transform: scale(1.0);  opacity: 1;   filter: blur(0px); }
  }
  .sc-fadein  { animation: scFadeUp 0.5s cubic-bezier(.22,1,.36,1) both; }
  .sc-card-in { animation: scCardIn 1.8s cubic-bezier(0.34,1.56,0.64,1) both; }
`

export default function ShowcaseCards({ currentLang = 'ku' }) {
  const [cards, setCards]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const [paused, setPaused]       = useState(false)
  const [progress, setProgress]   = useState(0)
  const [bgColor, setBgColor]     = useState(null)
  const [dims, setDims]           = useState({ cardW: 280, cardH: 373, gap1: 90, gap2: 150 })
  const [animKey, setAnimKey]     = useState(0)

  const touchStartX = useRef(null)
  const activeRef   = useRef(0)

  useEffect(() => { activeRef.current = activeIdx }, [activeIdx])

  const isRTL  = currentLang === 'ku' || currentLang === 'ar'
  const kuFont = currentLang === 'ku' ? { fontFamily: 'UniSalar, Tahoma, sans-serif' }
    : currentLang === 'ar' ? { fontFamily: 'ArabicFont, Tahoma, sans-serif' } : {}

  const labels = {
    title:  currentLang === 'ku' ? 'سۆشیاڵ میدیا' : currentLang === 'ar' ? 'سوشال مدیا'  : 'Social Media',
    visit:  currentLang === 'ku' ? 'سەردانی بکە'   : currentLang === 'ar' ? 'زيارة'        : 'Visit',
    social: currentLang === 'ku' ? 'میدیا'          : currentLang === 'ar' ? 'مدیا'          : 'Media',
  }

  /* ── Card dimensions & gap — fixed sizes to match 3:4 spec ── */
  useEffect(() => {
    const calc = () => {
      const w     = window.innerWidth
      const mobile = w < 640
      const cardW  = mobile ? 210 : 255
      const cardH  = Math.round(cardW * 16 / 9)
      setDims({
        cardW,
        cardH,
        gap1: mobile ? 90  : 135,
        gap2: mobile ? 150 : 220,
      })
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  /* ── Data ── */
  useEffect(() => {
    fetch('/api/showcase-cards')
      .then(r => r.json())
      .then(json => setCards(json.cards || []))
      .catch(() => {})
      .finally(() => setLoading(false))

    const sb = getSupabaseClient()
    sb?.from('settings').select('showcase_bg_color').single()
      .then(({ data }) => { if (data?.showcase_bg_color) setBgColor(data.showcase_bg_color) })
  }, [])

  /* ── Navigation ── */
  const goTo = useCallback((raw) => {
    const total = cards.length
    if (!total) return
    const idx = ((raw % total) + total) % total
    activeRef.current = idx
    setActiveIdx(idx)
    setProgress(0)
    setAnimKey(k => k + 1)
  }, [cards.length])

  /* ── Auto-advance ── */
  useEffect(() => {
    if (cards.length <= 1 || paused) return
    setProgress(0)
    const ticks = INTERVAL / TICK_MS
    let tick = 0
    const id = setInterval(() => {
      tick++
      setProgress(tick / ticks * 100)
      if (tick >= ticks) {
        tick = 0
        setProgress(0)
        setActiveIdx(prev => {
          const next = prev >= cards.length - 1 ? 0 : prev + 1
          activeRef.current = next
          return next
        })
      }
    }, TICK_MS)
    return () => clearInterval(id)
  }, [cards.length, paused, activeIdx])

  /* ── Touch swipe ── */
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; setPaused(true) }
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 48) goTo(activeRef.current + (dx > 0 ? -1 : 1))
    touchStartX.current = null
    setPaused(false)
  }

  /* ── States ── */
  if (loading) return (
    <section id="showcase" className="h-screen flex items-center justify-center bg-slate-950">
      <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </section>
  )
  if (!cards.length) return null

  const total   = cards.length
  const offsets = total === 1 ? [0] : total === 2 ? [-1, 0, 1] : [-2, -1, 0, 1, 2]
  const { cardW, cardH, gap1, gap2 } = dims

  return (
    <section
      id="showcase"
      className="relative h-[calc(100dvh-4rem)] md:h-screen bg-slate-950 text-white overflow-hidden flex flex-col justify-between py-6"
      style={bgColor ? { background: bgColor } : {}}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <style>{SHOWCASE_CSS}</style>

      {/* Deep atmospheric gradient */}
      {!bgColor && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black pointer-events-none z-0" />
      )}

      {/* Amber radial backlight behind the card stack */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(217,119,6,0.18) 0%, transparent 65%)' }}
      />

      {/* ── Section header ── */}
      <div className="relative z-10 flex items-center justify-center gap-4 px-6 shrink-0 sc-fadein">
        <span
          className="flex-1 max-w-[72px] h-px"
          style={{ background: bgColor
            ? 'linear-gradient(to right, transparent, rgba(30,41,59,0.4))'
            : 'linear-gradient(to right, transparent, rgba(245,158,11,0.55))' }}
        />
        <h2
          className="text-2xl lg:text-3xl font-black tracking-wide"
          style={{ color: bgColor ? '#1e293b' : '#ffffff', ...kuFont }}
        >
          {labels.title}
        </h2>
        <span
          className="flex-1 max-w-[72px] h-px"
          style={{ background: bgColor
            ? 'linear-gradient(to left, transparent, rgba(30,41,59,0.4))'
            : 'linear-gradient(to left, transparent, rgba(245,158,11,0.55))' }}
        />
      </div>

      {/* ── 3D Card stack ── */}
      <div
        className="relative flex-1 min-h-0 flex items-center justify-center z-10"
        dir="ltr"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
      >
        {offsets.map((offset) => {
          const cardIdx  = ((activeIdx + offset) % total + total) % total
          const card     = cards[cardIdx]
          const abs      = Math.abs(offset)
          const isActive = abs === 0

          const scale      = abs === 0 ? 1.0  : abs === 1 ? 0.85  : abs === 2 ? 0.70  : 0.58
          const opacity    = abs === 0 ? 1    : abs === 1 ? 0.38  : abs === 2 ? 0.18  : 0
          const zIndex     = abs === 0 ? 30   : abs === 1 ? 20    : abs === 2 ? 10    : 0
          const rotateYDeg = abs === 0 ? 0    : abs === 1 ? offset * -12 : offset * -15
          const brightness = abs === 0 ? 1    : abs === 1 ? 0.55  : 0.35
          const blurPx     = abs === 0 ? 0    : abs === 1 ? 4     : 8
          const offsetPx   = abs === 0 ? 0    : abs === 1 ? offset * gap1 : offset * gap2

          return (
            <div
              key={`${offset}-${cardIdx}`}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                width: cardW,
                height: cardH,
                transform: `translateX(calc(-50% + ${offsetPx}px)) translateY(-50%) scale(${scale}) rotateY(${rotateYDeg}deg)`,
                opacity,
                zIndex,
                filter: `brightness(${brightness})${blurPx ? ` blur(${blurPx}px)` : ''}`,
                cursor: isActive ? (card.redirect_url ? 'pointer' : 'default') : 'pointer',
                pointerEvents: abs > 2 ? 'none' : 'auto',
                willChange: 'transform, opacity',
                /* spring overshoot on position; faster fade separate from scale */
                transition: 'transform 1.8s cubic-bezier(0.34,1.56,0.64,1), opacity 1.3s ease-out, filter 1.4s ease',
                transformStyle: 'preserve-3d',
              }}
              onClick={() => {
                if (!isActive) { goTo(activeIdx + offset); return }
                if (card.redirect_url) window.open(card.redirect_url, '_blank', 'noopener noreferrer')
              }}
            >
              {/* Pop-in animation layer — re-mounts on animKey when active */}
              <div
                key={isActive ? animKey : 'idle'}
                className={`relative w-full h-full${isActive ? ' sc-card-in' : ''}`}
              >
              {/* ── Card face ── */}
              <div
                className="relative w-full h-full rounded-[28px] overflow-hidden"
                style={{
                  boxShadow: isActive
                    ? '0 25px 60px -10px rgba(0,0,0,0.90)'
                    : 'none',
                  transition: 'box-shadow 1.8s ease',
                }}
              >
                {/* Image */}
                <Image
                  src={card.image_url}
                  alt={getTitle(card, currentLang)}
                  fill
                  className="object-cover"
                  unoptimized
                />

                {/* Gradient scrim — top dark, mid clear, bottom dark */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.48) 0%, transparent 28%, transparent 54%, rgba(0,0,0,0.80) 100%)' }}
                />

                {/* Top badge — active only */}
                {isActive && (
                  <div
                    className="absolute top-3 text-white/90 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{
                      [isRTL ? 'left' : 'right']: 12,
                      background: 'rgba(0,0,0,0.50)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    {labels.social}
                  </div>
                )}

                {/* Bottom compact glass pill — active only */}
                {isActive && (
                  <div
                    className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 p-2.5 rounded-2xl z-20"
                    style={{
                      background: 'rgba(2,6,23,0.80)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  >
                    {/* Title */}
                    <p
                      className="text-white text-xs font-bold leading-snug truncate"
                      style={{ maxWidth: 170, ...kuFont }}
                    >
                      {getTitle(card, currentLang) || labels.social}
                    </p>

                    {/* Action button */}
                    {card.redirect_url && (
                      <a
                        href={card.redirect_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="shrink-0 flex items-center gap-1 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs px-3 py-1 rounded-xl transition-all"
                        style={kuFont}
                      >
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                          <path d="M2 10L10 2M10 2H5M10 2v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{labels.visit}</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Top edge shimmer */}
                <div
                  className="absolute inset-x-0 top-0 h-px pointer-events-none"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.22), transparent)' }}
                />
              </div>
              </div>{/* end pop-in layer */}
            </div>
          )
        })}
      </div>

      {/* ── Glass control pod ── */}
      <div className="relative z-40 flex justify-center shrink-0 sc-fadein px-4">
        <div
          className="flex items-center gap-4 px-5 py-2 rounded-full shadow-2xl"
          style={{
            background: 'rgba(15,23,42,0.70)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          {/* Prev */}
          <button
            onClick={() => goTo(activeIdx - 1)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10 active:scale-90"
            style={{ color: 'rgba(255,255,255,0.75)' }}
            aria-label="Previous"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleX(-1)' }}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="relative overflow-hidden rounded-full transition-all duration-300 h-2"
                style={{
                  width: i === activeIdx ? 26 : 7,
                  background: i === activeIdx ? 'rgba(245,158,11,0.30)' : 'rgba(255,255,255,0.22)',
                }}
                aria-label={`Go to slide ${i + 1}`}
              >
                {i === activeIdx && (
                  <span
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                      transition: `width ${TICK_MS}ms linear`,
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Next */}
          <button
            onClick={() => goTo(activeIdx + 1)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10 active:scale-90"
            style={{ color: 'rgba(255,255,255,0.75)' }}
            aria-label="Next"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleX(-1)' }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

    </section>
  )
}
