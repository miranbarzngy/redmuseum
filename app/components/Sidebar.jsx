'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getSupabaseClient } from '../lib/supabase-client'
import { useMuseumName } from '../lib/useMuseumName'

const GOLD = '#c8a96e'
const RED  = '#7a0000'

const SETTING_KEYS = [
  'show_visitor_tab','show_about','show_gallery','show_archive',
  'show_messages','show_exclusive','show_english','show_arabic','show_showcase',
]
const DEFAULT_SECTION_ORDER = [
  'slides','about','virtual-tour','gallery','archive','exclusive','showcase','messages','reserve',
]
const ORDER_TO_SIDEBAR_ID = {
  slides: 'home', about: 'about', 'virtual-tour': 'virtual-tour',
  gallery: 'gallery', archive: 'archive-section', exclusive: 'exclusive-section',
  showcase: 'showcase', messages: 'contact', reserve: 'reserve',
}

const FLAG_URLS = {
  kurdistan: '/assets/images/Flag_of_Kurdistan.png',
  uk:        'https://flagcdn.com/w80/gb.png',
  iraq:      'https://flagcdn.com/w80/iq.png',
}

// Map URL path segments to sidebar item IDs
const PATH_TO_ID = {
  slides:            'home',
  about:             'about',
  'virtual-tour':    'virtual-tour',
  gallery:           'gallery',
  archive:           'archive-section',
  museumactivities:  'exclusive-section',
  showcase:          'showcase',
  contact:           'contact',
  reserve:           'reserve',
}
const ROOT_PATHS = ['/', '/kurdish', '/arabic']

export default function Sidebar({ activeSection = 'home', onSectionClick, currentLang = 'en', onLangChange }) {
  const pathname = usePathname()
  const [currentHash, setCurrentHash]       = useState('')
  const [scrollActive, setScrollActive]     = useState(null)
  const [showExclusive, setShowExclusive]   = useState(false)
  const [sectionVis, setSectionVis]         = useState({
    show_visitor_tab: true, show_about: true, show_gallery: true,
    show_archive: true, show_messages: true, show_exclusive: true,
    show_english: true, show_arabic: true, show_showcase: true,
  })
  const [sectionOrder, setSectionOrder]     = useState(DEFAULT_SECTION_ORDER)
  const [drawerOpen, setDrawerOpen]         = useState(false)
  const [mounted, setMounted]               = useState(false)
  const museumName                          = useMuseumName()

  const ff    = currentLang === 'ku' ? 'UniSalar, Tahoma, sans-serif'
              : currentLang === 'ar' ? 'ArabicFont, Tahoma, sans-serif'
              : 'inherit'
  const isRtl = currentLang === 'ku' || currentLang === 'ar'

  useEffect(() => { setMounted(true) }, [])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!mounted) return
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen, mounted])

  // Settings fetch
  useEffect(() => {
    const supabase = getSupabaseClient()
    if (supabase) {
      supabase.from('exclusive_events').select('is_active').limit(1).maybeSingle()
        .then(({ data }) => { if (data) setShowExclusive(data.is_active) })
        .catch(() => {})
    }
    const allKeys = [...SETTING_KEYS, 'section_order']
    fetch(`/api/settings?keys=${allKeys.join(',')}`)
      .then(r => r.json())
      .then(json => {
        const map = json.values || {}
        SETTING_KEYS.forEach(key => {
          if (map[key] !== undefined)
            setSectionVis(p => ({ ...p, [key]: map[key] === 'true' }))
        })
        if (map.section_order) {
          try {
            const parsed = JSON.parse(map.section_order)
            if (Array.isArray(parsed) && parsed.length > 0) {
              const missing = DEFAULT_SECTION_ORDER.filter(id => !parsed.includes(id))
              setSectionOrder([...parsed, ...missing])
            }
          } catch {}
        }
      })
      .catch(() => {})
  }, [])

  // Hash tracking
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#', '')
      if (h) setCurrentHash(h)
    }
    onHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Scroll-based active section — works on any page with section elements
  useEffect(() => {
    if (!mounted) return
    const SECTION_IDS = [
      'home', 'about', 'virtual-tour', 'gallery', 'archive-section',
      'exclusive-section', 'showcase', 'contact', 'reserve',
    ]
    const update = () => {
      const trigger = window.innerHeight * 0.4 // section top must be above 40% of viewport
      let found = null
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= trigger) found = id
      }
      setScrollActive(found)
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [mounted])

  // ── Languages ──────────────────────────────────────────────
  const allLanguages = [
    { code: 'ku', name: 'کوردی',   flag: 'kurdistan', href: '/kurdish' },
    { code: 'en', name: 'English', flag: 'uk',        href: '/',        visKey: 'show_english' },
    { code: 'ar', name: 'عربی',   flag: 'iraq',      href: '/arabic',  visKey: 'show_arabic' },
  ]
  const languages = allLanguages.filter(l => !l.visKey || sectionVis[l.visKey] !== false)

  const renderFlag = (flagType) => (
    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-white">
      <Image src={FLAG_URLS[flagType]} alt={flagType} width={32} height={32} className="w-full h-full object-cover" unoptimized />
    </div>
  )

  // ── Menu item definitions ───────────────────────────────────
  const baseItems = currentLang === 'ku' ? [
    { id: 'home',            icon: 'ri-home-6-line',          title: 'سەرەتا',     href: '/kurdish' },
    { id: 'about',           icon: 'ri-profile-line',         title: 'دەربارە',    href: '/kurdish#about' },
    { id: 'virtual-tour',    icon: 'ri-eye-2-line',           title: 'بینینی ٣٦٠', href: '/kurdish#virtual-tour' },
    { id: 'gallery',         icon: 'ri-image-line',           title: 'گەلەری',     href: '/kurdish#gallery' },
    { id: 'archive-section', icon: 'ri-archive-line',         title: 'ئەرشیف',     href: '/kurdish#archive-section' },
    { id: 'showcase',        icon: 'ri-layout-grid-line',     title: 'میدیا',      href: '/kurdish#showcase' },
    { id: 'contact',         icon: 'ri-contacts-book-3-line', title: 'پەیوەندی',   href: '/kurdish#contact' },
  ] : currentLang === 'ar' ? [
    { id: 'home',            icon: 'ri-home-6-line',          title: 'الرئيسية',   href: '/arabic' },
    { id: 'about',           icon: 'ri-profile-line',         title: 'حول المتحف', href: '/arabic#about' },
    { id: 'virtual-tour',    icon: 'ri-eye-2-line',           title: 'جولة ٣٦٠',  href: '/arabic#virtual-tour' },
    { id: 'gallery',         icon: 'ri-image-line',           title: 'معرض',       href: '/arabic#gallery' },
    { id: 'archive-section', icon: 'ri-archive-line',         title: 'الأرشيف',   href: '/arabic#archive-section' },
    { id: 'showcase',        icon: 'ri-layout-grid-line',     title: 'میدیا',      href: '/arabic#showcase' },
    { id: 'contact',         icon: 'ri-contacts-book-3-line', title: 'اتصل بنا',  href: '/arabic#contact' },
  ] : [
    { id: 'home',            icon: 'ri-home-6-line',          title: 'Home',     href: '/' },
    { id: 'about',           icon: 'ri-profile-line',         title: 'About',    href: '/#about' },
    { id: 'virtual-tour',    icon: 'ri-eye-2-line',           title: 'VR Tour',  href: '/#virtual-tour' },
    { id: 'gallery',         icon: 'ri-image-line',           title: 'Gallery',  href: '/#gallery' },
    { id: 'archive-section', icon: 'ri-archive-line',         title: 'Archive',  href: '/#archive-section' },
    { id: 'showcase',        icon: 'ri-layout-grid-line',     title: 'Media',    href: '/#showcase' },
    { id: 'contact',         icon: 'ri-contacts-book-3-line', title: 'Contact',  href: '/#contact' },
  ]

  const exclusiveItem = currentLang === 'ku'
    ? { id: 'exclusive-section', icon: 'ri-star-line', title: 'چالاکییەکان',   href: '/kurdish#exclusive-section' }
    : currentLang === 'ar'
    ? { id: 'exclusive-section', icon: 'ri-star-line', title: 'الأنشطة',       href: '/arabic#exclusive-section' }
    : { id: 'exclusive-section', icon: 'ri-star-line', title: 'Activities',     href: '/#exclusive-section' }

  const reserveItem = currentLang === 'ku'
    ? { id: 'reserve', icon: 'ri-calendar-check-line', title: 'سەردان',    href: '/kurdish#reserve' }
    : currentLang === 'ar'
    ? { id: 'reserve', icon: 'ri-calendar-check-line', title: 'حجز',       href: '/arabic#reserve' }
    : { id: 'reserve', icon: 'ri-calendar-check-line', title: 'Reserve',   href: '/#reserve' }

  const sectionKeyMap = {
    about: 'show_about', gallery: 'show_gallery',
    'archive-section': 'show_archive', showcase: 'show_showcase',
    contact: 'show_messages',
  }
  const filteredBase    = baseItems.filter(item => !sectionKeyMap[item.id] || sectionVis[sectionKeyMap[item.id]] !== false)
  const showExcl        = showExclusive && sectionVis.show_exclusive !== false
  const itemPool        = {
    ...Object.fromEntries(filteredBase.map(item => [item.id, item])),
    ...(showExcl                       ? { 'exclusive-section': exclusiveItem } : {}),
    ...(sectionVis.show_visitor_tab    ? { reserve: reserveItem }               : {}),
  }
  const orderedIds      = ['home', ...sectionOrder.map(k => ORDER_TO_SIDEBAR_ID[k]).filter(id => id && id !== 'home')]
  const menuItems       = [
    ...orderedIds.map(id => itemPool[id]).filter(Boolean),
    ...Object.values(itemPool).filter(item => !orderedIds.includes(item.id)),
  ]

  // Derive active item from URL path for standalone sub-pages
  const isStandalonePage = !ROOT_PATHS.includes(pathname)
  const lastSegment      = pathname.split('/').filter(Boolean).pop() || ''
  const pathActiveId     = PATH_TO_ID[lastSegment] ?? null

  const isActive = (id) => {
    // Home-page layouts drive activeSection via IntersectionObserver — trust the prop first.
    // scrollActive (Sidebar's own listener) is kept as a fallback for standalone pages
    // that don't pass a dynamically updated activeSection.
    if (activeSection && activeSection !== 'home') return id === activeSection
    // On pages that don't manage their own scroll spy, fall back to internal tracking
    if (scrollActive !== null) return id === scrollActive
    // URL hash (set by hashchange events)
    if (currentHash) return id === currentHash
    // Path-based for standalone pages when not yet scrolled
    if (isStandalonePage && pathActiveId !== null) return id === pathActiveId
    // Final fallback
    return id === activeSection
  }

  const handleClick = (item) => {
    setDrawerOpen(false)
    if (item.href && !item.href.includes('#')) {
      window.location.href = item.href
      return
    }
    if (onSectionClick) onSectionClick(item.id)
    const el = document.getElementById(item.id)
    if (el) {
      const offset = window.innerWidth < 768 ? 64 : 0
      window.scrollTo({ top: el.offsetTop - offset, behavior: 'smooth' })
    }
  }

  const toggleLanguage = (langCode, href) => {
    setDrawerOpen(false)
    if (onLangChange) onLangChange(langCode)
    window.location.href = href
  }

  const headerTitle = currentLang === 'ku' ? museumName.kr
                    : currentLang === 'ar' ? museumName.ar
                    : museumName.en

  // ── SSR skeleton ───────────────────────────────────────────
  if (!mounted) return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[999] h-16 md:hidden" style={{ background: 'rgba(0,0,0,0.85)' }} />
      <div className="hidden md:block fixed z-[999] rounded-r-2xl"
           style={{ left: 0, top: '50%', transform: 'translateY(-50%)', width: 72, height: 220, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }} />
    </>
  )

  return (
    <>
      {/* ════════════════════════════════════════════
          MOBILE — sticky top header
      ════════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-[999] h-16 flex items-center gap-3 px-3 md:hidden"
        dir="ltr"
        style={{ background: RED, borderBottom: '1px solid rgba(0,0,0,0.25)' }}
      >
        {/* Hamburger */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl active:scale-90 transition-transform duration-150"
          style={{ background: 'rgba(0,0,0,0.25)' }}
        >
          <i className="ri-menu-3-line text-xl text-white" />
        </button>

        {/* Logo */}
        <div
          className="flex-shrink-0 rounded-xl overflow-hidden"
          style={{ width: 40, height: 40, background: '#ffffff', padding: 0 }}
        >
          <Image
            src="/android-chrome-512x512.png"
            alt="Museum logo"
            width={40}
            height={40}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>

        {/* Name stack */}
        <div dir={isRtl ? 'rtl' : 'ltr'} className="min-w-0 flex-1">
          <p className="font-bold leading-tight truncate" style={{ fontSize: 13.5, color: '#ffffff', fontFamily: ff }}>
            {headerTitle}
          </p>
          <p className="leading-tight mt-0.5 truncate" style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.60)' }}>
            Amnasuraka National Museum
          </p>
        </div>
      </header>

      {/* ════════════════════════════════════════════
          MOBILE — full-screen drawer
      ════════════════════════════════════════════ */}
      <div
        className="fixed inset-0 z-[1000] flex-col md:hidden"
        style={{
          display: drawerOpen ? 'flex' : 'none',
          background: 'rgba(3,3,3,0.97)',
          backdropFilter: 'blur(24px)',
        }}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Drawer header — mirrors the main header layout */}
        <div
          className="h-16 flex items-center gap-3 px-3 flex-shrink-0"
          dir="ltr"
          style={{ background: RED, borderBottom: '1px solid rgba(0,0,0,0.25)' }}
        >
          {/* Close button (same size/shape as hamburger) */}
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl active:scale-90 transition-transform duration-150"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <i className="ri-close-line text-xl text-white" />
          </button>

          {/* Logo (same as main header) */}
          <div
            className="flex-shrink-0 rounded-xl overflow-hidden"
            style={{ width: 40, height: 40, background: '#ffffff', padding: 0 }}
          >
            <Image
              src="/android-chrome-512x512.png"
              alt="Museum logo"
              width={40}
              height={40}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>

          {/* Name + subtitle */}
          <div dir={isRtl ? 'rtl' : 'ltr'} className="min-w-0 flex-1">
            <p className="font-bold leading-tight truncate" style={{ fontSize: 13.5, color: '#ffffff', fontFamily: ff }}>
              {headerTitle}
            </p>
            <p className="leading-tight mt-0.5" style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)' }}>
              Amnasuraka National Museum
            </p>
          </div>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-10">

          {/* ── 3-column nav grid ── */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {menuItems.map(item => {
              const active    = isActive(item.id)
              const isReserve = item.id === 'reserve'
              return (
                <button
                  key={item.id}
                  onClick={() => handleClick(item)}
                  className="flex flex-col items-center gap-2.5 py-5 px-2 rounded-2xl transition-all duration-200 active:scale-95"
                  style={{
                    background: active
                      ? (isReserve ? 'rgba(200,169,110,0.10)' : 'rgba(122,0,0,0.30)')
                      : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${active
                      ? (isReserve ? 'rgba(200,169,110,0.45)' : 'rgba(220,38,38,0.45)')
                      : 'rgba(255,255,255,0.07)'}`,
                    boxShadow: active ? (isReserve ? '0 0 20px rgba(200,169,110,0.08)' : '0 0 20px rgba(122,0,0,0.15)') : 'none',
                  }}
                >
                  <i
                    className={`${item.icon} text-[26px]`}
                    style={{ color: active ? (isReserve ? GOLD : '#fff') : '#6b7280' }}
                  />
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: active ? GOLD : '#9ca3af',
                    fontFamily: ff,
                    lineHeight: 1.3,
                    textAlign: 'center',
                  }}>
                    {item.title}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Divider */}
          <div className="h-px mb-7" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,169,110,0.22), transparent)' }} />

          {/* Language row */}
          <p className="text-center text-[10px] mb-4 uppercase tracking-widest" style={{ color: '#4b5563', fontFamily: ff }}>
            {currentLang === 'ku' ? 'زمان' : currentLang === 'ar' ? 'اللغة' : 'Language'}
          </p>
          <div className="flex items-center justify-center gap-7">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => toggleLanguage(lang.code, lang.href)}
                className="flex flex-col items-center gap-2 transition-all duration-200 active:scale-90"
              >
                <div className={`rounded-full overflow-hidden transition-all duration-300 ${
                  currentLang === lang.code
                    ? 'ring-2 ring-red-600 ring-offset-2 ring-offset-black scale-110'
                    : 'opacity-45 hover:opacity-80'
                }`}>
                  {renderFlag(lang.flag)}
                </div>
                <span className="text-[10px]" style={{
                  color: currentLang === lang.code ? GOLD : '#6b7280',
                  fontFamily: ff,
                }}>
                  {lang.name}
                </span>
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* ════════════════════════════════════════════
          DESKTOP — persistent left sidebar
      ════════════════════════════════════════════ */}
      <nav
        className="hidden md:flex fixed z-[999] flex-col items-center rounded-r-2xl py-3 overflow-y-auto"
        style={{
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 72,
          maxHeight: '95vh',
          background: 'rgba(0,0,0,0.80)',
          backdropFilter: 'blur(12px)',
          scrollbarWidth: 'none',
        }}
      >
        {/* Language flags */}
        <div className="flex flex-col items-center w-full mb-1.5">
          {languages.map(lang => (
            <button
              key={lang.code}
              className="h-[46px] w-full flex items-center justify-center transition-all duration-200 hover:opacity-100"
              onClick={() => toggleLanguage(lang.code, lang.href)}
              title={lang.name}
            >
              <div className={`rounded-full overflow-hidden transition-all duration-300 ${
                currentLang === lang.code
                  ? 'ring-2 ring-red-600 ring-offset-2 ring-offset-black scale-110'
                  : 'opacity-45 hover:opacity-90 hover:scale-105'
              }`}>
                {renderFlag(lang.flag)}
              </div>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-9 h-px mb-1.5" style={{ background: 'rgba(255,255,255,0.12)' }} />

        {/* Nav item cards */}
        <div className="flex flex-col items-center w-full gap-0.5 px-1.5">
          {menuItems.map(item => {
            const active    = isActive(item.id)
            const isReserve = item.id === 'reserve'
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item)}
                className="w-full flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/[0.05] active:scale-95"
                style={{
                  background: active
                    ? (isReserve ? 'rgba(200,169,110,0.10)' : 'rgba(122,0,0,0.30)')
                    : 'transparent',
                  border: `1px solid ${active
                    ? (isReserve ? 'rgba(200,169,110,0.40)' : 'rgba(220,38,38,0.40)')
                    : 'transparent'}`,
                }}
              >
                <i
                  className={`${item.icon} text-lg`}
                  style={{ color: active ? (isReserve ? GOLD : '#fff') : '#6b7280' }}
                />
                <span style={{
                  fontSize: 9,
                  fontWeight: 500,
                  color: active ? GOLD : '#6b7280',
                  fontFamily: ff,
                  lineHeight: 1.3,
                  textAlign: 'center',
                  maxWidth: 64,
                  overflow: 'hidden',
                  display: 'block',
                  padding: '0 2px',
                }}>
                  {item.title}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
