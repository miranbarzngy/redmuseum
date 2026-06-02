'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase-client'

const CATEGORY_META = {
  activity:   { ku: 'چالاکییەکان',  en: 'Activities',           ar: 'الأنشطة',          icon: 'ri-calendar-event-line' },
  donation:   { ku: 'بەخشین',       en: 'Donations',             ar: 'التبرعات',          icon: 'ri-heart-line' },
  visitor:    { ku: 'سەردانی میوان', en: 'Visitor Touring',       ar: 'جولات الزوار',      icon: 'ri-walk-line' },
  delegation: { ku: 'وەفدی فەرمی',  en: 'Official Delegations',  ar: 'الوفود الرسمية',    icon: 'ri-group-line' },
}

const SCROLL_DIR = { activity: 'scroll-left', donation: 'scroll-right', visitor: 'scroll-left', delegation: 'scroll-right' }

const normalizePath = (path) => {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return path.startsWith('/') ? path : `/${path}`
}

function Lightbox({ images, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx)
  const prev = useCallback(() => setIdx(i => (i <= 0 ? images.length - 1 : i - 1)), [images.length])
  const next = useCallback(() => setIdx(i => (i >= images.length - 1 ? 0 : i + 1)), [images.length])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [onClose, prev, next])

  const img = images[idx]

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close */}
      <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-colors" onClick={onClose}>
        <i className="ri-close-line" />
      </button>

      {/* Counter */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-sm font-mono">
        {idx + 1} / {images.length}
      </div>

      {/* Prev */}
      {images.length > 1 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-[#7a0000] border border-white/10 hover:border-[#c8a96e] flex items-center justify-center text-white text-2xl transition-all z-10"
          onClick={e => { e.stopPropagation(); prev() }}
        >
          <i className="ri-arrow-left-s-line" />
        </button>
      )}

      {/* Image */}
      <div className="relative max-w-5xl max-h-[85vh] w-full px-16 flex flex-col items-center" onClick={e => e.stopPropagation()}>
        <img
          src={img.image_url}
          alt={img.title || ''}
          className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
          style={{ boxShadow: '0 0 0 1px rgba(200,169,110,0.2), 0 32px 80px rgba(0,0,0,0.8)' }}
        />
        {img.title && (
          <p className="mt-4 text-white/70 text-sm text-center">{img.title}</p>
        )}
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-[#7a0000] border border-white/10 hover:border-[#c8a96e] flex items-center justify-center text-white text-2xl transition-all z-10"
          onClick={e => { e.stopPropagation(); next() }}
        >
          <i className="ri-arrow-right-s-line" />
        </button>
      )}

      {/* Dot strip */}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setIdx(i) }}
              className="rounded-full transition-all duration-300"
              style={{ width: i === idx ? 20 : 6, height: 6, background: i === idx ? '#c8a96e' : 'rgba(255,255,255,0.2)' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Gallery({ currentLang = 'en' }) {
  const isKu = currentLang === 'ku'
  const isAr = currentLang === 'ar'
  const [galleries, setGalleries] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null) // { images, idx }
  const [activeCategory, setActiveCategory] = useState(null)
  const [bgColor, setBgColor] = useState('#0a0a0a')

  const langKey = isAr ? 'ar' : isKu ? 'ku' : 'en'
  const font = isKu ? { fontFamily: 'UniSalar, Tahoma, sans-serif' } : isAr ? { fontFamily: 'Cairo, Tahoma, sans-serif' } : {}

  useEffect(() => {
    supabase?.from('settings').select('gallery_bg_color').single()
      .then(({ data }) => { if (data?.gallery_bg_color) setBgColor(data.gallery_bg_color) })
  }, [])

  const fetchGallery = async () => {
    if (!supabase) { setLoading(false); return }
    try {
      const { data } = await supabase
        .from('gallery')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (data?.length) {
        const grouped = {}
        data.forEach(img => {
          const cat = img.category || 'visitor'
          if (!grouped[cat]) grouped[cat] = []
          const url = normalizePath(img.image_url)
          if (url) grouped[cat].push({ id: img.id, image_url: url, title: img.title || '' })
        })
        const arr = Object.keys(grouped).map(cat => ({ category: cat, images: grouped[cat] }))
        setGalleries(arr)
        setActiveCategory(arr[0]?.category || null)
      }
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchGallery() }, [])


  const title = isAr ? 'المعرض' : isKu ? 'گەلەری' : 'Gallery'

  if (loading) return (
    <section id="gallery" className="min-h-screen flex items-center justify-center" style={{ background: bgColor }}>
      <div className="w-10 h-10 border-2 border-[#c8a96e] border-t-transparent rounded-full animate-spin" />
    </section>
  )

  if (!galleries.length || galleries.every(g => !g.images.length)) return (
    <section id="gallery" className="min-h-screen flex items-center justify-center" style={{ background: bgColor }}>
      <p className="text-white/40 text-sm" style={font}>
        {isAr ? 'لا توجد صور في المعرض.' : isKu ? 'هیچ وێنەیەک لە گەلەریدا نییە.' : 'No images found in the gallery.'}
      </p>
    </section>
  )

  const visible = galleries.filter(g => g.images.length > 0)

  return (
    <>
      <section id="gallery" className="py-16" style={{ background: bgColor }}>

        {/* Section header */}
        <div className="flex items-center justify-center gap-4 mb-10 px-8">
          <span className="block w-16 h-1 rounded-full bg-gradient-to-r from-transparent to-[#c8a96e]" />
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide" style={font}>{title}</h2>
          <span className="block w-16 h-1 rounded-full bg-gradient-to-l from-transparent to-[#c8a96e]" />
        </div>

        {/* Category tab pills */}
        <div className="flex items-center justify-center flex-wrap gap-2 mb-12 px-8" dir={isKu || isAr ? 'rtl' : 'ltr'}>
          {visible.map(g => {
            const meta = CATEGORY_META[g.category] || {}
            const isActive = activeCategory === g.category
            return (
              <button
                key={g.category}
                onClick={() => {
                  setActiveCategory(g.category)
                  document.getElementById(`cat-${g.category}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 border"
                style={{
                  ...font,
                  background: isActive ? '#7a0000' : 'rgba(255,255,255,0.04)',
                  borderColor: isActive ? '#c8a96e' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  boxShadow: isActive ? '0 4px 20px rgba(122,0,0,0.4)' : 'none',
                }}
              >
                <i className={`${meta.icon || 'ri-image-line'} text-base`} style={{ color: isActive ? '#c8a96e' : 'inherit' }} />
                {meta[langKey] || g.category}
              </button>
            )
          })}
        </div>

        {/* Gallery strips */}
        <div className="space-y-14">
          {visible.map((g, gi) => {
            const meta = CATEGORY_META[g.category] || {}
            const dir = SCROLL_DIR[g.category] || 'scroll-left'
            const speed = Math.max(20, g.images.length * 4)

            return (
              <div key={g.category} id={`cat-${g.category}`}>

                {/* Category label */}
                <div
                  className="flex items-center gap-3 px-8 mb-5"
                  dir={isKu || isAr ? 'rtl' : 'ltr'}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#7a0000]/80 border border-[#c8a96e]/30 flex items-center justify-center flex-shrink-0">
                    <i className={`${meta.icon || 'ri-image-line'} text-[#c8a96e] text-sm`} />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-white/80" style={font}>
                    {meta[langKey] || g.category}
                  </h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#c8a96e]/30 to-transparent" />
                  </div>

                {/* Infinite scroll strip */}
                <div className="w-full overflow-hidden" dir="ltr">
                  <div
                    className="scroll-track"
                    style={{ animation: `${dir === 'scroll-left' ? 'scroll-left' : 'scroll-right'} ${speed}s linear infinite`, gap: '6px' }}
                    onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
                    onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}
                  >
                    {[...g.images, ...g.images].map((img, i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 relative group cursor-pointer overflow-hidden"
                        style={{ width: 'clamp(180px, 18vw, 280px)', height: 'clamp(130px, 13vw, 200px)', borderRadius: 12 }}
                        onClick={() => setLightbox({ images: g.images, idx: i % g.images.length })}
                      >
                        <img
                          src={img.image_url}
                          alt={img.title || ''}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 rounded-xl">
                          <i className="ri-zoom-in-line text-white text-2xl" />
                          {img.title && (
                            <p className="text-white text-xs font-semibold text-center px-3 line-clamp-2" style={font}>{img.title}</p>
                          )}
                        </div>
                        {/* Gold border on hover */}
                        <div className="absolute inset-0 rounded-xl border border-[#c8a96e] opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none" />
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )
          })}
        </div>

      </section>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          startIdx={lightbox.idx}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  )
}
