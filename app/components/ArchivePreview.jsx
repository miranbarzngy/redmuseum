'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase-client'

const defaultCategories = [
  { id: 'documents', name_en: 'Documents', name_ku: 'بەڵگەنامەکان', name_ar: 'المستندات', slug: 'documents' },
  { id: 'letters',   name_en: 'Letters',   name_ku: 'نامەکان',       name_ar: 'الرسائل',   slug: 'letters'   },
  { id: 'photos',    name_en: 'Photos',    name_ku: 'وێنە کۆنەکان', name_ar: 'الصور القديمة', slug: 'photos' },
]

const categoryStringToSlug = { Documents: 'documents', Letters: 'letters', Photos: 'photos' }

const normalizePath = (p) => {
  if (!p) return null
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  return p.startsWith('/') ? p : `/${p}`
}

const INTERVAL = 5000
const TICK_MS  = 50

const ARCHIVE_CSS = `
  @keyframes archCardIn {
    0%   { transform: scale(0.88); opacity: 0.4; }
    60%  { transform: scale(1.04); opacity: 1; }
    80%  { transform: scale(0.98); }
    100% { transform: scale(1.0);  opacity: 1; }
  }
  .arch-card-in { animation: archCardIn 0.9s cubic-bezier(0.34,1.56,0.64,1) both; }
`

export default function ArchivePreview({ currentLang = 'en' }) {
  const [archive,      setArchive]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [categories,   setCategories]   = useState(defaultCategories)
  const [progress,     setProgress]     = useState(0)
  const [paused,       setPaused]       = useState(false)
  const [bgColor,      setBgColor]      = useState('#0a0a0a')
  const [animKey,      setAnimKey]      = useState(0)
  const [dims,         setDims]         = useState({ cardW: 200, gap1: 190, gap2: 350, wide: false })

  const touchStartX = useRef(null)
  const idxRef      = useRef(0)

  const isKu  = currentLang === 'ku'
  const isAr  = currentLang === 'ar'
  const isRtl = isKu || isAr
  const font  = isKu ? { fontFamily: 'UniSalar, Tahoma, sans-serif' }
              : isAr ? { fontFamily: 'ArabicFont, Tahoma, sans-serif' }
              : {}

  /* ── Responsive dimensions ── */
  useEffect(() => {
    const calc = () => {
      const w      = window.innerWidth
      const mobile = w < 640
      const wide  = w >= 900
      const cardW = mobile ? Math.min(Math.round(w * 0.57), 285)
                  : wide   ? Math.min(Math.round(w * 0.26), 330)
                  :          Math.min(Math.round(w * 0.33), 300)
      // ~44% of cardW — same ratio as ShowcaseCards which looked correct
      const gap1  = Math.round(cardW * 0.44)
      const gap2  = Math.round(cardW * 0.58)
      setDims({ cardW, gap1, gap2, wide })
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  useEffect(() => {
    supabase?.from('settings').select('archive_bg_color').single()
      .then(({ data }) => { if (data?.archive_bg_color) setBgColor(data.archive_bg_color) })
  }, [])

  useEffect(() => { fetchCategories() }, [])
  useEffect(() => { fetchArchive() }, [])

  const fetchCategories = async () => {
    if (!supabase) { setCategories(defaultCategories); return }
    try {
      const { data } = await supabase.from('archive_categories').select('*').order('display_order', { ascending: true })
      setCategories(data?.length ? data : defaultCategories)
    } catch { setCategories(defaultCategories) }
  }

  const fetchArchive = async () => {
    if (!supabase) {
      setArchive([
        { id:'1', title_ku:'بەڵگەنامەی ئەنفال', title_en:'Anfal Campaign Document', title_ar:'وثيقة حملة الأنفال', description_ku:'بەڵگەنامەیەکی مێژوویی کە لە ئەرشیفی مۆزەخانەکەدا پارێزراوە', description_en:'A rare historical document preserved in the museum archive', description_ar:'وثيقة تاريخية نادرة', category:'Documents', category_id:'documents', image_url:'/assets/images/anfal.png', date_created: new Date().toISOString() },
        { id:'2', title_ku:'نامەیەک لە ساڵانی ١٩٦٠', title_en:'Letter from the 1960s', title_ar:'رسالة من ستينيات القرن الماضي', description_ku:'نامەیەکی دەگمەن لە ساڵانی شەستەکانی سەدەی ڕابردوو', description_en:'A rare letter from the 1960s', description_ar:'رسالة نادرة من ستينيات القرن الماضي', category:'Letters', category_id:'letters', image_url:'/assets/images/awenakan.png', date_created: new Date().toISOString() },
        { id:'3', title_ku:'کۆمەڵەی وێنە کۆنەکان', title_en:'Old Photo Collection', title_ar:'مجموعة الصور القديمة', description_ku:'کۆمەڵەیەک لە وێنە مێژووییە کەمیابەکان', description_en:'A collection of rare historical photographs', description_ar:'مجموعة من الصور التاريخية النادرة', category:'Photos', category_id:'photos', image_url:'/assets/images/bg-1.jpg', date_created: new Date().toISOString() },
      ])
      setLoading(false)
      return
    }
    try {
      const { data } = await supabase.from('digital_archive').select('*').eq('is_active', true)
      const shuffled = (data || []).sort(() => Math.random() - 0.5)
      setArchive(shuffled.slice(0, 6))
    } catch {}
    finally { setLoading(false) }
  }

  const navigate = useCallback((dir) => {
    setCurrentIndex(i => {
      const next = dir === 'prev'
        ? (i <= 0 ? archive.length - 1 : i - 1)
        : (i >= archive.length - 1 ? 0 : i + 1)
      idxRef.current = next
      return next
    })
    setProgress(0)
    setAnimKey(k => k + 1)
  }, [archive.length])

  const goTo = useCallback((i) => {
    idxRef.current = i
    setCurrentIndex(i)
    setProgress(0)
    setAnimKey(k => k + 1)
  }, [])

  const prev = useCallback(() => navigate('prev'), [navigate])
  const next = useCallback(() => navigate('next'), [navigate])

  /* ── Auto-advance ── */
  useEffect(() => {
    if (archive.length <= 1 || paused) return
    setProgress(0)
    const ticks = INTERVAL / TICK_MS
    let tick = 0
    const id = setInterval(() => {
      tick++
      setProgress(tick / ticks * 100)
      if (tick >= ticks) {
        tick = 0; setProgress(0)
        setCurrentIndex(p => {
          const n = p >= archive.length - 1 ? 0 : p + 1
          idxRef.current = n; return n
        })
        setAnimKey(k => k + 1)
      }
    }, TICK_MS)
    return () => clearInterval(id)
  }, [archive.length, paused, currentIndex])

  /* ── Touch swipe ── */
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; setPaused(true) }
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 44) dx > 0 ? prev() : next()
    touchStartX.current = null; setPaused(false)
  }

  const getCategoryName = (item) => {
    const cat = categories.find(c => c.id === (item?.category_id || (() => {
      const slug = categoryStringToSlug[item?.category] || item?.category?.toLowerCase()
      return categories.find(c => c.slug === slug)?.id
    })()))
    if (!cat) return item?.category || ''
    return isAr ? (cat.name_ar || cat.name_en) : isKu ? (cat.name_ku || cat.name_en) : cat.name_en
  }

  const getTitle       = (item) => isAr ? (item?.title_ar || item?.title_ku || item?.title_en || '') : isKu ? (item?.title_ku || item?.title_en || item?.title_ar || '') : (item?.title_en || item?.title_ku || item?.title_ar || '')
  const getDescription = (item) => isAr ? (item?.description_ar || item?.description_ku || item?.description_en || '') : isKu ? (item?.description_ku || item?.description_en || item?.description_ar || '') : (item?.description_en || item?.description_ku || item?.description_ar || '')

  const archiveLink   = isKu ? '/kurdish/all-archive' : isAr ? '/arabic/archive' : '/archive'
  const getDetailLink = (item) => isKu ? `/kurdish/archive/${item.id}` : isAr ? `/arabic/archive/${item.id}` : `/archive/${item.id}`

  const sectionTitle = isAr ? 'الأرشيف الرقمي' : isKu ? 'ئەرشیفی دیجیتاڵی' : 'Digital Archive'
  const sectionSub   = isAr ? 'المستندات التاريخية والصور النادرة' : isKu ? 'بەڵگەنامە و وێنە مێژووییەکان' : 'Historical Documents & Rare Photos'
  const viewAllLabel = isAr ? 'عرض كل الأرشيف' : isKu ? 'بینینی هەموو ئەرشیفەکە' : 'View All Archive'
  const readMore     = isAr ? 'اقرأ المزيد' : isKu ? 'زیاتر بخوێنەوە' : 'Read more'

  if (loading) return (
    <section id="archive-section" className="min-h-[400px] flex items-center justify-center" style={{ background: bgColor }}>
      <div className="w-10 h-10 border-2 border-[#c8a96e] border-t-transparent rounded-full animate-spin" />
    </section>
  )

  if (!archive.length) return null

  const hasMultiple = archive.length > 1
  const total       = archive.length
  const { cardW, gap1, gap2, wide } = dims
  // show ±2 only on wide screens with enough cards
  const offsets = total === 1 ? [0]
    : (wide && total >= 4) ? [-2, -1, 0, 1, 2]
    : [-1, 0, 1]

  const activeItem = archive[currentIndex]

  return (
    <section
      id="archive-section"
      className="h-[calc(100dvh-4rem)] md:h-screen overflow-hidden flex flex-col"
      style={{ background: bgColor }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <style>{ARCHIVE_CSS}</style>

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col flex-1 min-h-0 items-center justify-between py-4 lg:py-6">

        {/* ① Header */}
        <div className="flex flex-col items-center flex-shrink-0 w-full">
          <div className="flex items-center gap-3 lg:gap-4 mb-1">
            <span className="block w-10 lg:w-16 h-px"
              style={{ background: 'linear-gradient(to right, transparent, #c8a96e)' }} />
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-900 tracking-wide text-center" style={font}>
              {sectionTitle}
            </h2>
            <span className="block w-10 lg:w-16 h-px"
              style={{ background: 'linear-gradient(to left, transparent, #c8a96e)' }} />
          </div>
          <p className="text-neutral-500 text-xs sm:text-sm text-center" style={font}>{sectionSub}</p>
        </div>

        {/* ② 3-card carousel */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0 w-full">

          {/* Card stack — positioned relative, overflow visible so side cards peek */}
          <div
            className="relative flex items-center justify-center"
            dir="ltr"
            style={{ width: '100%', height: Math.round(cardW * 297 / 210) }}
          >
            {offsets.map((offset) => {
              const idx      = ((currentIndex + offset) % total + total) % total
              const card     = archive[idx]
              const isActive = offset === 0
              const abs      = Math.abs(offset)

              const scale      = abs === 0 ? 1.0  : abs === 1 ? 0.80  : 0.62
              const opacity    = abs === 0 ? 1    : abs === 1 ? 0.52  : 0.28
              const zIndex     = abs === 0 ? 20   : abs === 1 ? 10    : 5
              const brightness = abs === 0 ? 1    : abs === 1 ? 0.60  : 0.42
              const offsetPx   = abs === 0 ? 0    : abs === 1 ? offset * gap1 : offset * gap2

              return (
                <div
                  key={`${offset}-${idx}`}
                  className="absolute"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: cardW,
                    transform: `translateX(calc(-50% + ${offsetPx}px)) translateY(-50%) scale(${scale})`,
                    opacity,
                    zIndex,
                    filter: `brightness(${brightness})`,
                    transition: 'transform 0.9s cubic-bezier(0.34,1.56,0.64,1), opacity 0.7s ease-out, filter 0.7s ease',
                    cursor: 'pointer',
                    willChange: 'transform, opacity',
                  }}
                  onClick={() => { if (!isActive) offset < 0 ? prev() : next() }}
                >
                  {/* Pop-in animation wrapper — remounts when active changes */}
                  <div
                    key={isActive ? animKey : 'idle'}
                    className={isActive ? 'arch-card-in' : ''}
                  >
                    <Link
                      href={isActive ? getDetailLink(card) : '#'}
                      onClick={e => { if (!isActive) e.preventDefault() }}
                      className="group block"
                    >
                      <img
                        src={normalizePath(card?.image_url)}
                        alt={getTitle(card)}
                        className="w-full block transition-transform duration-700 group-hover:scale-[1.03]"
                        style={{ aspectRatio: '210/297', objectFit: 'contain', background: 'transparent', display: 'block' }}
                        onError={e => { e.target.src = '/assets/images/bg-1.jpg' }}
                      />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Text for active item */}
          <div
            className="text-center flex-shrink-0"
            style={{ width: 'clamp(220px, 66vw, 380px)' }}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {getCategoryName(activeItem) && (
              <span
                className="inline-flex items-center text-[11px] font-bold px-3 py-1 rounded-full mb-1.5"
                style={{ background: 'rgba(122,0,0,0.09)', color: '#7a0000', border: '1px solid rgba(122,0,0,0.2)', ...font }}
              >
                {getCategoryName(activeItem)}
              </span>
            )}
            <h3 className="text-base sm:text-lg font-black text-neutral-900 leading-snug line-clamp-1 mb-1" style={font}>
              {getTitle(activeItem)}
            </h3>
            <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-1.5" style={font}>
              {getDescription(activeItem)}
            </p>
            <Link href={getDetailLink(activeItem)} className="inline-flex items-center gap-1.5 group/rm">
              <span className="text-[#7a0000] text-[11px] sm:text-xs font-bold tracking-wide group-hover/rm:underline" style={font}>
                {readMore}
              </span>
              <i className={`ri-arrow-${isRtl ? 'left' : 'right'}-line text-[#7a0000] text-xs transition-transform duration-200 ${isRtl ? 'group-hover/rm:-translate-x-0.5' : 'group-hover/rm:translate-x-0.5'}`} />
            </Link>
          </div>

        </div>

        {/* ③ Dots + View All */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">

          {hasMultiple && (
            <div className="flex justify-center items-center gap-3">
              {/* Prev */}
              <button
                onClick={prev}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{ background: 'rgba(122,0,0,0.12)', border: '1px solid rgba(122,0,0,0.25)', color: '#7a0000' }}
                aria-label="Previous"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleX(-1)' }}>
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {/* Dots */}
              {archive.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="relative overflow-hidden rounded-full transition-all duration-300"
                  style={{ width: i === currentIndex ? 28 : 6, height: 6, background: i === currentIndex ? 'rgba(200,169,110,0.45)' : 'rgba(0,0,0,0.18)' }}
                >
                  {i === currentIndex && (
                    <span
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${progress}%`, background: '#c8a96e', transition: `width ${TICK_MS}ms linear` }}
                    />
                  )}
                </button>
              ))}

              {/* Next */}
              <button
                onClick={next}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{ background: 'rgba(122,0,0,0.12)', border: '1px solid rgba(122,0,0,0.25)', color: '#7a0000' }}
                aria-label="Next"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleX(-1)' }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          )}

          <Link
            href={archiveLink}
            className="inline-flex items-center gap-2 px-5 lg:px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white transition-all duration-300"
            style={{ background: '#7a0000', border: '1px solid rgba(200,169,110,0.3)', boxShadow: '0 4px 20px rgba(122,0,0,0.35)', ...font }}
            onMouseEnter={e => { e.currentTarget.style.background = '#8f0000'; e.currentTarget.style.borderColor = '#c8a96e' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#7a0000'; e.currentTarget.style.borderColor = 'rgba(200,169,110,0.3)' }}
          >
            {viewAllLabel}
            <i className={`ri-arrow-${isRtl ? 'left' : 'right'}-line`} />
          </Link>

        </div>

      </div>
    </section>
  )
}
