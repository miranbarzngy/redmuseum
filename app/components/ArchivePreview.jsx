'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
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

  const isKu = currentLang === 'ku'
  const isAr = currentLang === 'ar'
  const font = isKu ? { fontFamily: 'UniSalar, Tahoma, sans-serif' }
             : isAr ? { fontFamily: 'Cairo, Tahoma, sans-serif' }
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
        { id:'1', title_ku:'بەڵگەنامەی ئەنفال', title_en:'Anfal Campaign Document', title_ar:'وثيقة حملة الأنفال', description_ku:'بەڵگەنامەیەکی مێژوویی', description_en:'Historical document', description_ar:'وثيقة تاريخية', category:'Documents', category_id:'documents', image_url:'/assets/images/anfal.png', date_created: new Date().toISOString() },
        { id:'2', title_ku:'نامەیەک لە ساڵانی ١٩٦٠', title_en:'Letter from 1960s', title_ar:'رسالة من الستينيات', description_ku:'نامەیەکی دەگمەن', description_en:'Rare letter', description_ar:'رسالة نادرة', category:'Letters', category_id:'letters', image_url:'/assets/images/awenakan.png', date_created: new Date().toISOString() },
        { id:'3', title_ku:'کۆمەڵەی وێنە کۆنەکان', title_en:'Old Photo Collection', title_ar:'مجموعة الصور القديمة', description_ku:'کۆمەڵەیەک لە وێنە مێژووییە', description_en:'Collection of rare photos', description_ar:'مجموعة من الصور النادرة', category:'Photos', category_id:'photos', image_url:'/assets/images/bg-1.jpg', date_created: new Date().toISOString() },
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

  // Auto-advance with progress
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

  // Category helpers
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

  const getTitle = (item) => {
    if (isAr) return item?.title_ar || item?.title_ku || item?.title_en || ''
    if (isKu) return item?.title_ku || item?.title_en || item?.title_ar || ''
    return item?.title_en || item?.title_ku || item?.title_ar || ''
  }

  const getDescription = (item) => {
    if (isAr) return item?.description_ar || item?.description_ku || item?.description_en || ''
    if (isKu) return item?.description_ku || item?.description_en || item?.description_ar || ''
    return item?.description_en || item?.description_ku || item?.description_ar || ''
  }

  const formatDate = (d) => {
    if (!d) return ''
    const date = new Date(d)
    const day = date.getDate(), month = date.getMonth() + 1, year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const archiveLink   = isKu ? '/kurdish/archive' : isAr ? '/arabic/archive' : '/archive'
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

  const item = archive[currentIndex]

  return (
    <section
      id="archive-section"
      className="py-16"
      style={{ background: bgColor }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container mx-auto px-4 md:px-8 lg:px-16">

        {/* Section header */}
        <div className="flex flex-col items-center mb-12">
          <div className="flex items-center gap-4 mb-3">
            <span className="block w-16 h-1 rounded-full bg-gradient-to-r from-transparent to-[#c8a96e]" />
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide" style={font}>{sectionTitle}</h2>
            <span className="block w-16 h-1 rounded-full bg-gradient-to-l from-transparent to-[#c8a96e]" />
          </div>
          <p className="text-white text-sm" style={font}>{sectionSub}</p>
        </div>

        {/* Card */}
        <div className="relative max-w-4xl mx-auto">
          <Link
            href={getDetailLink(item)}
            className="block rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #111 0%, #0d0d0d 100%)', boxShadow: '0 0 0 1px rgba(200,169,110,0.15), 0 24px 60px rgba(0,0,0,0.7)' }}
          >
            <div className="flex flex-col md:flex-row" dir={isAr ? 'rtl' : 'ltr'}>

              {/* Image panel */}
              <div className="relative w-full md:w-[45%] flex-shrink-0 bg-[#080808] flex items-center justify-center overflow-hidden"
                style={{ minHeight: 280 }}>
                {/* Gold top accent */}
                <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60"
                  style={{ background: 'linear-gradient(to right, transparent, #c8a96e, transparent)' }} />

                <img
                  src={normalizePath(item?.image_url)}
                  alt={getTitle(item)}
                  className="w-full h-full object-contain p-6 transition-transform duration-700 hover:scale-105"
                  style={{ maxHeight: 380 }}
                  onError={e => { e.target.src = '/assets/images/bg-1.jpg' }}
                />

                {/* Category badge */}
                <span
                  className="absolute top-4 left-4 text-xs font-semibold px-3 py-1.5 rounded-full tracking-wide"
                  style={{ background: 'rgba(122,0,0,0.85)', color: '#c8a96e', border: '1px solid rgba(200,169,110,0.4)', fontFamily: font.fontFamily || 'inherit' }}
                >
                  {getCategoryName(item)}
                </span>

                {/* Slide counter */}
                <span className="absolute bottom-4 right-4 text-white/30 text-xs font-mono">
                  {currentIndex + 1} / {archive.length}
                </span>
              </div>

              {/* Content panel */}
              <div className="flex-1 p-6 md:p-10 flex flex-col justify-center gap-4">
                <h3 className="text-xl md:text-2xl font-bold text-white leading-snug" style={font}>
                  {getTitle(item)}
                </h3>
                <p className="text-white text-sm md:text-base leading-relaxed line-clamp-4" style={font}>
                  {getDescription(item)}
                </p>
                {item?.date_created && (
                  <p className="text-white/50 text-xs mt-auto flex items-center gap-1.5">
                    <i className="ri-calendar-line" />
                    {formatDate(item.date_created)}
                  </p>
                )}

                {/* Read more hint */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[#c8a96e] text-xs font-semibold tracking-wide" style={font}>
                    {isAr ? 'اقرأ المزيد' : isKu ? 'زیاتر بخوێنەوە' : 'Read more'}
                  </span>
                  <i className={`ri-arrow-${isAr ? 'left' : 'right'}-line text-[#c8a96e] text-xs`} />
                </div>
              </div>
            </div>
          </Link>

          {/* Prev arrow */}
          {archive.length > 1 && (
            <button
              onClick={e => { e.preventDefault(); prev() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl transition-all duration-200 bg-red-700 hover:bg-red-800"
            >
              <i className="ri-arrow-left-s-line" />
            </button>
          )}

          {/* Next arrow */}
          {archive.length > 1 && (
            <button
              onClick={e => { e.preventDefault(); next() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl transition-all duration-200 bg-red-700 hover:bg-red-800"
            >
              <i className="ri-arrow-right-s-line" />
            </button>
          )}
        </div>

        {/* Progress dots */}
        {archive.length > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            {archive.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentIndex(i); setProgress(0) }}
                className="relative overflow-hidden rounded-full transition-all duration-300"
                style={{
                  width: i === currentIndex ? 28 : 6,
                  height: 6,
                  background: i === currentIndex ? 'rgba(200,169,110,0.3)' : 'rgba(255,255,255,0.15)',
                }}
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

        {/* View All */}
        <div className="text-center mt-10">
          <Link
            href={archiveLink}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all duration-300"
            style={{ background: '#7a0000', border: '1px solid rgba(200,169,110,0.3)', boxShadow: '0 4px 20px rgba(122,0,0,0.35)', ...font }}
            onMouseEnter={e => { e.currentTarget.style.background = '#8a0000'; e.currentTarget.style.borderColor = '#c8a96e' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#7a0000'; e.currentTarget.style.borderColor = 'rgba(200,169,110,0.3)' }}
          >
            {viewAllLabel}
            <i className={`ri-arrow-${isAr ? 'left' : 'right'}-line`} />
          </Link>
        </div>

      </div>
    </section>
  )
}
