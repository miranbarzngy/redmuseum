'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { getSupabaseClient } from '../lib/supabase-client'

const LABELS = {
  ku: { title: 'سۆشیاڵ میدیا', empty: 'هیچ کارتێک بەردەست نییە' },
  ar: { title: 'سوشال مدیا', empty: 'لا توجد بطاقات متاحة' },
  en: { title: 'Social Media', empty: 'No cards available' },
}

const CARD_W   = 260  // base card px width
const CARD_GAP = 28   // gap between cards
const INTERVAL = 5000 // auto-advance ms

function getTitle(card, lang) {
  if (lang === 'ku' && card.title_ku) return card.title_ku
  if (lang === 'ar' && card.title_ar) return card.title_ar
  if (lang === 'en' && card.title_en) return card.title_en
  return card.title_ku || card.title_en || card.title_ar || ''
}

export default function ShowcaseCards({ currentLang = 'ku' }) {
  const [cards, setCards]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const [paused, setPaused]     = useState(false)
  const [progress, setProgress] = useState(0)
  const [bgColor, setBgColor]   = useState('#0a0a0a')
  const progressRef             = useRef(null)
  const isRTL = currentLang === 'ku' || currentLang === 'ar'
  const labels = LABELS[currentLang] || LABELS.ku

  useEffect(() => {
    fetch('/api/showcase-cards')
      .then(r => r.json())
      .then(json => setCards(json.cards || []))
      .catch(() => {})
      .finally(() => setLoading(false))

    const supabase = getSupabaseClient()
    supabase?.from('settings').select('showcase_bg_color').single()
      .then(({ data }) => { if (data?.showcase_bg_color) setBgColor(data.showcase_bg_color) })
  }, [])

  // Go to a specific index
  const goTo = useCallback((idx) => {
    setActiveIdx(idx)
    setProgress(0)
  }, [])

  const prev = () => goTo(activeIdx <= 0 ? cards.length - 1 : activeIdx - 1)
  const next = useCallback(() => goTo(activeIdx >= cards.length - 1 ? 0 : activeIdx + 1), [activeIdx, cards.length, goTo])

  // Auto-advance every INTERVAL ms with progress bar
  useEffect(() => {
    if (cards.length <= 1 || paused) return
    setProgress(0)

    const step = 50 // tick every 50ms
    const ticks = INTERVAL / step
    let tick = 0

    const id = setInterval(() => {
      tick++
      setProgress(tick / ticks * 100)
      if (tick >= ticks) {
        tick = 0
        setProgress(0)
        setActiveIdx(prev => (prev >= cards.length - 1 ? 0 : prev + 1))
      }
    }, step)

    return () => clearInterval(id)
  }, [cards.length, paused, activeIdx])

  if (loading) return (
    <section id="showcase" className="py-20 flex items-center justify-center" style={{ background: bgColor }}>
      <div className="w-6 h-6 border-2 border-[#c8a96e] border-t-transparent rounded-full animate-spin" />
    </section>
  )

  if (!cards.length) return null

  // Center-offset: translate the strip so activeIdx card is horizontally centered
  // Each card slot = CARD_W + CARD_GAP; center = 50vw - activeIdx*slot - CARD_W/2
  const slot = CARD_W + CARD_GAP
  const stripTranslate = `calc(50vw - ${activeIdx * slot + CARD_W / 2}px)`

  return (
    <section
      id="showcase"
      className="relative py-16 overflow-hidden"
      style={{ background: bgColor }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >

      {/* Section title — centered */}
      <div className="flex items-center justify-center gap-4 mb-24 px-8">
        <span className="block w-16 h-1 rounded-full bg-gradient-to-r from-transparent to-[#cc0000]" />
        <h2
          className="text-2xl md:text-3xl font-black text-white tracking-wide text-center"
          style={
            currentLang === 'ku' ? { fontFamily: 'UniSalar, Tahoma, sans-serif' }
            : currentLang === 'ar' ? { fontFamily: 'Cairo, Tahoma, sans-serif' }
            : {}
          }
        >
          {labels.title}
        </h2>
        <span className="block w-16 h-1 rounded-full bg-gradient-to-l from-transparent to-[#cc0000]" />
      </div>

      {/* Card strip — translate to center active card */}
      <div
        dir="ltr"
        className="relative flex items-end"
        style={{
          transform: `translateX(${stripTranslate})`,
          transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          gap: CARD_GAP,
          paddingBottom: 48, // room for title below
          willChange: 'transform',
        }}
      >
        {cards.map((card, i) => {
          const isActive = i === activeIdx
          const dist = Math.abs(i - activeIdx)

          return (
            <div
              key={card.id}
              className="flex-shrink-0 flex flex-col items-center cursor-pointer"
              style={{
                width: CARD_W,
                transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.5s ease',
                transform: isActive ? 'scale(1.18) translateY(-12px)' : dist === 1 ? 'scale(0.88) translateY(0)' : 'scale(0.75) translateY(8px)',
                opacity: isActive ? 1 : dist === 1 ? 0.5 : 0.25,
                zIndex: isActive ? 10 : 10 - dist,
              }}
              onClick={() => {
                if (isActive && card.redirect_url) window.open(card.redirect_url, '_blank', 'noopener')
                else goTo(i)
              }}
            >
              {/* Card image */}
              <div
                className="relative w-full overflow-hidden rounded-2xl"
                style={{
                  aspectRatio: '9 / 16',
                  boxShadow: isActive
                    ? '0 0 0 2px #c8a96e, 0 32px 80px rgba(0,0,0,0.85)'
                    : '0 8px 24px rgba(0,0,0,0.5)',
                  transition: 'box-shadow 0.5s ease',
                }}
              >
                <Image
                  src={card.image_url}
                  alt={getTitle(card, currentLang)}
                  fill
                  className="object-cover"
                  unoptimized
                />

                {/* Gradient bottom overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)' }}
                />

                {/* Gold top accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 opacity-70"
                  style={{ background: 'linear-gradient(to right, transparent, #c8a96e, transparent)' }}
                />

                {/* Click hint on active card */}
                {isActive && card.redirect_url && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <i className="ri-external-link-line text-[#c8a96e] text-xs" />
                    <span className="text-white text-[10px] font-semibold tracking-wide whitespace-nowrap">
                      {currentLang === 'ku' ? 'کلیک بکە' : currentLang === 'ar' ? 'انقر هنا' : 'Visit'}
                    </span>
                  </div>
                )}
              </div>

              {/* Title below */}
              {getTitle(card, currentLang) && (
                <p
                  className="mt-3 text-center text-sm font-semibold transition-colors duration-300 max-w-full px-1"
                  dir={isRTL ? 'rtl' : 'ltr'}
                  style={{
                    color: isActive ? '#c8a96e' : 'rgba(255,255,255,0.4)',
                    fontFamily: currentLang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : currentLang === 'ar' ? 'Cairo, Tahoma, sans-serif' : 'inherit',
                    transition: 'color 0.4s ease',
                  }}
                >
                  {getTitle(card, currentLang)}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Navigation arrows */}
      {cards.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 border border-white/10 hover:bg-[#7a0000] hover:border-[#c8a96e] transition-all flex items-center justify-center text-white backdrop-blur-sm"
          >
            <i className="ri-arrow-left-s-line text-xl" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 border border-white/10 hover:bg-[#7a0000] hover:border-[#c8a96e] transition-all flex items-center justify-center text-white backdrop-blur-sm"
          >
            <i className="ri-arrow-right-s-line text-xl" />
          </button>
        </>
      )}

      {/* Progress + dot indicators */}
      {cards.length > 1 && (
        <div className="flex justify-center items-center gap-2 mt-2">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="relative overflow-hidden rounded-full transition-all duration-300"
              style={{
                width: activeIdx === i ? 28 : 6,
                height: 6,
                background: activeIdx === i ? 'rgba(200,169,110,0.3)' : 'rgba(255,255,255,0.15)',
              }}
            >
              {activeIdx === i && (
                <span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: '#c8a96e',
                    transition: 'width 50ms linear',
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}

    </section>
  )
}
