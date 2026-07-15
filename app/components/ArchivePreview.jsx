'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
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

export default function ArchivePreview({ currentLang = 'en' }) {
  const [archive,      setArchive]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [categories,   setCategories]   = useState(defaultCategories)
  const [progress,     setProgress]     = useState(0)
  const [paused,       setPaused]       = useState(false)
  const [bgColor,      setBgColor]      = useState('#0a0a0a')

  const isKu  = currentLang === 'ku'
  const isAr  = currentLang === 'ar'
  const isRtl = isKu || isAr
  const font  = isKu ? { fontFamily: 'UniSalar, Tahoma, sans-serif' }
              : isAr ? { fontFamily: 'ArabicFont, Tahoma, sans-serif' }
              : {}

  useEffect(() => {
    supabase?.from('settings').select('archive_bg_color').single()
      .then(({ data }) => { if (data?.archive_bg_color) setBgColor(data.archive_bg_color) })
  }, [])

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    if (!supabase) { setCategories(defaultCategories); return }
    try {
      const { data } = await supabase.from('archive_categories').select('*').order('display_order', { ascending: true })
      setCategories(data?.length ? data : defaultCategories)
    } catch { setCategories(defaultCategories) }
  }

  useEffect(() => { fetchArchive() }, [])

  const fetchArchive = async () => {
    if (!supabase) {
      setArchive([
        { id:'1', title_ku:'بەڵگەنامەی ئەنفال', title_en:'Anfal Campaign Document', title_ar:'وثيقة حملة الأنفال', description_ku:'بەڵگەنامەیەکی مێژوویی کە لە ئەرشیفی مۆزەخانەکەدا پارێزراوە', description_en:'A rare historical document preserved in the museum archive', description_ar:'وثيقة تاريخية نادرة محفوظة في أرشيف المتحف', category:'Documents', category_id:'documents', image_url:'/assets/images/anfal.png', date_created: new Date().toISOString() },
        { id:'2', title_ku:'نامەیەک لە ساڵانی ١٩٦٠', title_en:'Letter from the 1960s', title_ar:'رسالة من ستينيات القرن الماضي', description_ku:'نامەیەکی دەگمەن لە ساڵانی شەستەکانی سەدەی ڕابردوو', description_en:'A rare letter from the 1960s found in our archive collection', description_ar:'رسالة نادرة من ستينيات القرن الماضي من مجموعتنا', category:'Letters', category_id:'letters', image_url:'/assets/images/awenakan.png', date_created: new Date().toISOString() },
        { id:'3', title_ku:'کۆمەڵەی وێنە کۆنەکان', title_en:'Old Photo Collection', title_ar:'مجموعة الصور القديمة', description_ku:'کۆمەڵەیەک لە وێنە مێژووییە کەمیابەکان لە ئەرشیفەکانمان', description_en:'A collection of rare historical photographs from our archives', description_ar:'مجموعة من الصور التاريخية النادرة من أرشيفنا', category:'Photos', category_id:'photos', image_url:'/assets/images/bg-1.jpg', date_created: new Date().toISOString() },
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

  const prev = useCallback(() => {
    setCurrentIndex(i => (i <= 0 ? archive.length - 1 : i - 1))
    setProgress(0)
  }, [archive.length])

  const next = useCallback(() => {
    setCurrentIndex(i => (i >= archive.length - 1 ? 0 : i + 1))
    setProgress(0)
  }, [archive.length])

  useEffect(() => {
    if (archive.length <= 1 || paused) return
    setProgress(0)
    const step = 50
    const ticks = INTERVAL / step
    let tick = 0
    const id = setInterval(() => {
      tick++
      setProgress(tick / ticks * 100)
      if (tick >= ticks) { tick = 0; setProgress(0); setCurrentIndex(p => (p >= archive.length - 1 ? 0 : p + 1)) }
    }, step)
    return () => clearInterval(id)
  }, [archive.length, paused, currentIndex])

  const getItemCategoryId = (item) => {
    if (item?.category_id) return item.category_id
    if (item?.category) {
      const slug = categoryStringToSlug[item.category] || item.category.toLowerCase()
      return categories.find(c => c.slug === slug)?.id
    }
    return null
  }

  const getCategoryName = (item) => {
    const cat = categories.find(c => c.id === getItemCategoryId(item))
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

  if (loading) return (
    <section id="archive-section" className="min-h-[400px] flex items-center justify-center" style={{ background: bgColor }}>
      <div className="w-10 h-10 border-2 border-[#c8a96e] border-t-transparent rounded-full animate-spin" />
    </section>
  )

  if (!archive.length) return null

  const item        = archive[currentIndex]
  const hasMultiple = archive.length > 1

  return (
    <section
      id="archive-section"
      className="h-[calc(100dvh-4rem)] md:h-screen overflow-hidden flex flex-col"
      style={{ background: bgColor }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/*
        Three-group justify-between layout:
          ① Section header  (top)
          ② Image carousel + text  (middle — grows to fill)
          ③ Dots + View All  (bottom)
        Space between groups is distributed automatically so there is
        never a dead gap at the bottom, on any screen size.
      */}
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

        {/* ② Carousel + text — the image height fills whatever space is available */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">

          {/* Portrait card */}
          <Link
            href={getDetailLink(item)}
            className="group relative block rounded-2xl overflow-hidden flex-shrink-0"
            style={{
              width: 'clamp(200px, 46vw, 280px)',
              boxShadow: '0 0 0 1px rgba(200,169,110,0.15), 0 20px 56px rgba(0,0,0,0.28)',
            }}
          >
            <img
              src={normalizePath(item?.image_url)}
              alt={getTitle(item)}
              className="w-full h-auto block transition-transform duration-700 group-hover:scale-105"
              onError={e => { e.target.src = '/assets/images/bg-1.jpg' }}
            />

            {/* Gold hairline top */}
            <div className="absolute top-0 inset-x-0 h-0.5 pointer-events-none z-10"
              style={{ background: 'linear-gradient(to right, transparent, #c8a96e, transparent)' }} />

            {/* Slide counter */}
            {hasMultiple && (
              <span
                className="absolute top-3 left-3 z-10 text-white/80 text-[10px] font-mono px-2 py-0.5 rounded-full select-none"
                style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
              >
                {currentIndex + 1} / {archive.length}
              </span>
            )}
          </Link>

          {/* Prev / Next — grouped pair, slides-page style, dir=ltr so arrows never flip */}
          {hasMultiple && (
            <div dir="ltr" className="flex gap-1 flex-shrink-0">
              <button
                onClick={prev}
                className="flex items-center justify-center rounded-xl w-9 h-9 text-white bg-red-700 hover:bg-red-800 transition-colors duration-200 select-none"
              >
                <i className="ri-arrow-left-s-line text-xl" />
              </button>
              <button
                onClick={next}
                className="flex items-center justify-center rounded-xl w-9 h-9 text-white bg-red-700 hover:bg-red-800 transition-colors duration-200 select-none"
              >
                <i className="ri-arrow-right-s-line text-xl" />
              </button>
            </div>
          )}

          {/* Text block — width tracks the image card */}
          <div
            className="text-center flex-shrink-0"
            style={{ width: 'clamp(220px, 66vw, 380px)' }}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {getCategoryName(item) && (
              <span
                className="inline-flex items-center text-[11px] font-bold px-3 py-1 rounded-full mb-1.5"
                style={{ background: 'rgba(122,0,0,0.09)', color: '#7a0000', border: '1px solid rgba(122,0,0,0.2)', fontFamily: font.fontFamily || 'inherit' }}
              >
                {getCategoryName(item)}
              </span>
            )}

            <h3 className="text-base sm:text-lg font-black text-neutral-900 leading-snug line-clamp-1 mb-1" style={font}>
              {getTitle(item)}
            </h3>

            <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-1.5" style={font}>
              {getDescription(item)}
            </p>

            <Link href={getDetailLink(item)} className="inline-flex items-center gap-1.5 group/rm">
              <span className="text-[#7a0000] text-[11px] sm:text-xs font-bold tracking-wide group-hover/rm:underline" style={font}>
                {isAr ? 'اقرأ المزيد' : isKu ? 'زیاتر بخوێنەوە' : 'Read more'}
              </span>
              <i className={`ri-arrow-${isRtl ? 'left' : 'right'}-line text-[#7a0000] text-xs transition-transform duration-200 ${isRtl ? 'group-hover/rm:-translate-x-0.5' : 'group-hover/rm:translate-x-0.5'}`} />
            </Link>
          </div>

        </div>

        {/* ③ Dots + View All — pinned to bottom */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">

          {hasMultiple && (
            <div className="flex justify-center items-center gap-2">
              {archive.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentIndex(i); setProgress(0) }}
                  className="relative overflow-hidden rounded-full transition-all duration-300"
                  style={{ width: i === currentIndex ? 28 : 6, height: 6, background: i === currentIndex ? 'rgba(200,169,110,0.45)' : 'rgba(0,0,0,0.18)' }}
                >
                  {i === currentIndex && (
                    <span
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${progress}%`, background: '#c8a96e', transition: 'width 50ms linear' }}
                    />
                  )}
                </button>
              ))}
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
