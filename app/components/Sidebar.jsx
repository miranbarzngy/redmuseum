'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getSupabaseClient } from '../lib/supabase-client'

const SETTING_KEYS = ['show_visitor_tab','show_about','show_gallery','show_archive','show_messages','show_exclusive','show_english','show_arabic','show_showcase']

const DEFAULT_SECTION_ORDER = ['slides','about','virtual-tour','gallery','archive','exclusive','showcase','messages','reserve']

// Maps section-order admin key → sidebar item id
const ORDER_TO_SIDEBAR_ID = {
  slides:         'home',
  about:          'about',
  'virtual-tour': 'virtual-tour',
  gallery:        'gallery',
  archive:        'archive-section',
  exclusive:      'exclusive-section',
  showcase:       'showcase',
  messages:       'contact',
  reserve:        'reserve',
}

export default function Sidebar({ activeSection = 'home', onSectionClick, currentLang = 'en', onLangChange }) {
  const [hoveredItem, setHoveredItem] = useState(null)
  const [currentHash, setCurrentHash] = useState('')
  const [showExclusive, setShowExclusive] = useState(false)
  const [sectionVis, setSectionVis] = useState({
    show_visitor_tab: true,
    show_about: true,
    show_gallery: true,
    show_archive: true,
    show_messages: true,
    show_exclusive: true,
    show_english: true,
    show_arabic: true,
    show_showcase: true,
  })
  const [sectionOrder, setSectionOrder] = useState(DEFAULT_SECTION_ORDER)
  const [isExpanded, setIsExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const updateVis = (key, val) => setSectionVis(p => ({ ...p, [key]: val }))

  // Fetch all section visibility settings in one batch request
  useEffect(() => {
    const supabase = getSupabaseClient()

    // Exclusive events active state
    if (supabase) {
      supabase.from('exclusive_events').select('is_active').limit(1).maybeSingle()
        .then(({ data }) => { if (data) setShowExclusive(data.is_active) })
        .catch(() => {})
    }

    // All site_settings keys in one request
    const allKeys = [...SETTING_KEYS, 'section_order']
    fetch(`/api/settings?keys=${allKeys.join(',')}`)
      .then(r => r.json())
      .then(json => {
        const map = json.values || {}
        SETTING_KEYS.forEach(key => {
          if (map[key] !== undefined) updateVis(key, map[key] === 'true')
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

  // Track URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) setCurrentHash(hash)
    }
    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const allLanguages = [
    { code: 'ku', name: 'کوردی',    flag: 'kurdistan', href: '/kurdish', visKey: null },
    { code: 'en', name: 'English',  flag: 'uk',        href: '/',        visKey: 'show_english' },
    { code: 'ar', name: 'العربية', flag: 'iraq',      href: '/arabic',  visKey: 'show_arabic' },
  ]
  const languages = allLanguages.filter(l => !l.visKey || sectionVis[l.visKey] !== false)

  const flagUrls = {
    kurdistan: '/assets/images/Flag_of_Kurdistan.png',
    uk:        'https://flagcdn.com/w80/gb.png',
    iraq:      'https://flagcdn.com/w80/iq.png',
  }

  const renderFlag = (flagType) => (
    <div className="w-7 h-7 aspect-square rounded-full overflow-hidden flex items-center justify-center bg-white flex-shrink-0">
      <Image src={flagUrls[flagType]} alt={flagType} width={32} height={32} className="w-full h-full object-cover" unoptimized />
    </div>
  )

  const exclusiveItem = currentLang === 'ku'
    ? { id: 'exclusive-section', icon: 'ri-star-line', title: 'چالاکییەکانی مۆزەخانە', href: '/kurdish#exclusive-section' }
    : currentLang === 'ar'
    ? { id: 'exclusive-section', icon: 'ri-star-line', title: 'أنشطة المتحف',            href: '/arabic#exclusive-section' }
    : { id: 'exclusive-section', icon: 'ri-star-line', title: 'Museum Activities',        href: '/#exclusive-section' }

  const baseItems = currentLang === 'ku'
    ? [
        { id: 'home',            icon: 'ri-home-6-line',          title: 'سەرەتا',     href: '/kurdish' },
        { id: 'about',           icon: 'ri-profile-line',         title: 'دەربارە',    href: '/kurdish#about' },
        { id: 'virtual-tour',    icon: 'ri-eye-2-line',           title: 'بینینی ٣٦٠', href: '/kurdish#virtual-tour' },
        { id: 'gallery',         icon: 'ri-image-line',           title: 'گەلەری',     href: '/kurdish#gallery' },
        { id: 'archive-section', icon: 'ri-archive-line',         title: 'ئەرشیف',    href: '/kurdish#archive-section' },
        { id: 'showcase',        icon: 'ri-layout-grid-line',     title: 'کارتەکان',  href: '/kurdish#showcase' },
        { id: 'contact',         icon: 'ri-contacts-book-3-line', title: 'پەیوەندی',  href: '/kurdish#contact' },
      ]
    : currentLang === 'ar'
    ? [
        { id: 'home',            icon: 'ri-home-6-line',          title: 'الرئيسية',   href: '/arabic' },
        { id: 'about',           icon: 'ri-profile-line',         title: 'حول المتحف', href: '/arabic#about' },
        { id: 'virtual-tour',    icon: 'ri-eye-2-line',           title: 'جولة ٣٦٠',  href: '/arabic#virtual-tour' },
        { id: 'gallery',         icon: 'ri-image-line',           title: 'معرض الصور', href: '/arabic#gallery' },
        { id: 'archive-section', icon: 'ri-archive-line',         title: 'الأرشيف',   href: '/arabic#archive-section' },
        { id: 'showcase',        icon: 'ri-layout-grid-line',     title: 'البطاقات',  href: '/arabic#showcase' },
        { id: 'contact',         icon: 'ri-contacts-book-3-line', title: 'اتصل بنا',  href: '/arabic#contact' },
      ]
    : [
        { id: 'home',            icon: 'ri-home-6-line',          title: 'Home',      href: '/' },
        { id: 'about',           icon: 'ri-profile-line',         title: 'About',     href: '/#about' },
        { id: 'virtual-tour',    icon: 'ri-eye-2-line',           title: 'VR Tour',   href: '/#virtual-tour' },
        { id: 'gallery',         icon: 'ri-image-line',           title: 'Gallery',   href: '/#gallery' },
        { id: 'archive-section', icon: 'ri-archive-line',         title: 'Archive',   href: '/#archive-section' },
        { id: 'showcase',        icon: 'ri-layout-grid-line',     title: 'Showcase',  href: '/#showcase' },
        { id: 'contact',         icon: 'ri-contacts-book-3-line', title: 'Contact',   href: '/#contact' },
      ]

  const reserveItem = currentLang === 'ku'
    ? { id: 'reserve', icon: 'ri-calendar-check-line', title: 'داواکاری سەردان', href: '/kurdish#reserve' }
    : currentLang === 'ar'
    ? { id: 'reserve', icon: 'ri-calendar-check-line', title: 'حجز زيارة',       href: '/arabic#reserve' }
    : { id: 'reserve', icon: 'ri-calendar-check-line', title: 'Reserve a Visit', href: '/#reserve' }

  // IDs that map to a site_settings key (home and virtual-tour are always shown)
  const sectionKeyMap = {
    about:           'show_about',
    gallery:         'show_gallery',
    'archive-section': 'show_archive',
    showcase:        'show_showcase',
    contact:         'show_messages',
  }

  const filteredBase = baseItems.filter(item => {
    const key = sectionKeyMap[item.id]
    return !key || sectionVis[key] !== false
  })

  const showExclusiveItem = showExclusive && sectionVis.show_exclusive !== false

  // Build a pool of all visible items keyed by sidebar id
  const itemPool = {
    ...Object.fromEntries(filteredBase.map(item => [item.id, item])),
    ...(showExclusiveItem ? { 'exclusive-section': exclusiveItem } : {}),
    ...(sectionVis.show_visitor_tab ? { reserve: reserveItem } : {}),
  }

  // Sort by section_order: home always first, then follow the saved order
  const orderedSidebarIds = [
    'home',
    ...sectionOrder
      .map(k => ORDER_TO_SIDEBAR_ID[k])
      .filter(id => id && id !== 'home'),
  ]
  const menuItems = [
    ...orderedSidebarIds.map(id => itemPool[id]).filter(Boolean),
    // Any item not covered by the order mapping (safety net)
    ...Object.values(itemPool).filter(item => !orderedSidebarIds.includes(item.id)),
  ]

  const isActive = (itemId) => activeSection === itemId || currentHash === itemId

  const currentIndex = menuItems.findIndex(item => isActive(item.id))
  const getIndicatorTop = () => currentIndex < 0 ? 12.5 : (currentIndex * 70) + 12.5

  const handleClick = (item) => {
    if (item.href && !item.href.includes('#')) {
      window.location.href = item.href
      return
    }
    if (onSectionClick) onSectionClick(item.id)
    const element = document.getElementById(item.id)
    if (element) window.scrollTo({ top: element.offsetTop - 80, behavior: 'smooth' })
  }

  const toggleLanguage = (langCode, href) => {
    if (onLangChange) onLangChange(langCode)
    window.location.href = href
  }

  // Active items for collapsed view — fall back to Kurdish if current lang is hidden
  const activeLang = languages.find(l => l.code === currentLang) || languages[0]
  // Fall back to known section definitions before resorting to home,
  // so the correct icon shows while DB data (showExclusive, etc.) is still loading
  const activeItem = menuItems.find(item => isActive(item.id))
    || (activeSection === 'exclusive-section' ? exclusiveItem : null)
    || (activeSection === 'reserve' ? reserveItem : null)
    || menuItems[0]

  const sideStyle = {
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    paddingTop: 12,
    paddingBottom: 12,
    width: 60,
  }

  if (!mounted) return (
    <div className="fixed z-[999] bg-black/80 backdrop-blur-md rounded-r-2xl" style={{ left: 0, top: '50%', transform: 'translateY(-50%)', width: 60, height: 180 }} />
  )

  return (
    <div
      className="fixed z-[999] flex flex-col items-center bg-black/80 backdrop-blur-md rounded-r-2xl overflow-y-auto"
      style={{
        ...sideStyle,
        maxHeight: '95vh',
        scrollbarWidth: 'none',
      }}
    >
      {isExpanded ? (
        /* ===== EXPANDED STATE ===== */
        <>
          {/* Language flags */}
          <div className="flex flex-col items-center">
            {languages.map((lang) => (
              <div
                key={lang.code}
                className="h-[70px] w-[60px] flex items-center justify-center relative cursor-pointer group"
                onClick={() => toggleLanguage(lang.code, lang.href)}
                title={lang.name}
              >
                <div className={`transition-all duration-300 hover:scale-125 shadow-lg rounded-full ${
                  currentLang === lang.code ? 'ring-2 ring-red-600 ring-offset-2 ring-offset-black scale-110' : ''
                }`}>
                  {renderFlag(lang.flag)}
                </div>
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {lang.name}
                </div>
              </div>
            ))}
          </div>

          <div className="w-10 h-px bg-white/20" />

          {/* Menu items */}
          <div className="relative flex flex-col items-center">
            <div
              className={`absolute w-[48px] h-[48px] rounded-full pointer-events-none transition-all duration-[600ms] ease-out ${currentIndex >= 0 ? 'opacity-100' : 'opacity-0'}`}
              style={{
                top: `${getIndicatorTop()}px`,
                background: 'radial-gradient(circle, #dc2626 0%, #991b1b 100%)',
                zIndex: 0,
                transform: 'translateX(-50%)',
                left: '50%',
                boxShadow: '0 0 20px rgba(220,38,38,0.6)',
              }}
            />
            <ul className="flex flex-col">
              {menuItems.map((item) => (
                <li
                  key={item.id}
                  className="group relative h-[70px] w-[60px] list-none flex items-center justify-center cursor-pointer"
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleClick(item)}
                >
                  <span
                    className="transition-all duration-300 flex items-center justify-center"
                    style={{
                      fontSize: 26,
                      color: isActive(item.id) ? '#ffffff' : '#9ca3af',
                      transform: isActive(item.id) ? 'scale(1.15)' : 'scale(1)',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <i className={item.icon} />
                  </span>
                  <span
                    className={`absolute left-[70px] bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap transition-all duration-300 pointer-events-none z-50 ${
                      hoveredItem === item.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                    }`}
                    style={{
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      fontFamily: currentLang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : 'inherit',
                    }}
                  >
                    {item.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-10 h-px bg-white/20" />

          {/* Collapse button */}
          <div
            className="h-[50px] w-[60px] flex items-center justify-center cursor-pointer group"
            onClick={() => setIsExpanded(false)}
            title="Collapse"
          >
            <i className="ri-arrow-up-s-line text-gray-400 group-hover:text-white transition-colors text-2xl" />
          </div>
        </>
      ) : (
        /* ===== COLLAPSED STATE ===== */
        <>
          {/* Active language flag */}
          <div
            className="h-[70px] w-[60px] flex items-center justify-center cursor-pointer group relative"
            onClick={() => setIsExpanded(true)}
            title={activeLang.name}
          >
            <div className="ring-2 ring-red-600 ring-offset-2 ring-offset-black rounded-full scale-110 transition-all duration-300 hover:scale-125">
              {renderFlag(activeLang.flag)}
            </div>
          </div>

          <div className="w-10 h-px bg-white/20" />

          {/* Active tab icon */}
          <div
            className="h-[70px] w-[60px] flex items-center justify-center cursor-pointer relative group"
            onClick={() => setIsExpanded(true)}
          >
            <div
              className="w-[48px] h-[48px] rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, #dc2626 0%, #991b1b 100%)',
                boxShadow: '0 0 20px rgba(220,38,38,0.6)',
              }}
            >
              <i className={`${activeItem?.icon || 'ri-home-6-line'} text-white text-2xl`} />
            </div>
          </div>

          <div className="w-10 h-px bg-white/20" />

          {/* Expand button */}
          <div
            className="h-[50px] w-[60px] flex items-center justify-center cursor-pointer group"
            onClick={() => setIsExpanded(true)}
            title="Expand menu"
          >
            <i className="ri-menu-line text-gray-400 group-hover:text-white transition-colors text-xl" />
          </div>
        </>
      )}
    </div>
  )
}
