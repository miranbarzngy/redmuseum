'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import Sidebar from '../components/Sidebar'
import Slider from '../components/Slider'
import { useMuseumName } from '../lib/useMuseumName'

// Lazy-load below-the-fold sections — reduces initial JS parse on mobile
const About            = dynamic(() => import('../components/About'),            { ssr: false })
const VRSection        = dynamic(() => import('../components/VRSection'),        { ssr: false })
const Gallery          = dynamic(() => import('../components/Gallery'),          { ssr: false })
const ArchivePreview   = dynamic(() => import('../components/ArchivePreview'),   { ssr: false })
const ExclusiveSection = dynamic(() => import('../components/ExclusiveSection'), { ssr: false })
const ShowcaseCards    = dynamic(() => import('../components/ShowcaseCards'),    { ssr: false })
const ContactForm      = dynamic(() => import('../components/ContactForm'),      { ssr: false })
const ReservePageContent = dynamic(() => import('../components/ReservePageContent'), { ssr: false })

const SECTION_KEYS = ['show_slides','show_about','show_gallery','show_archive','show_activities','show_exclusive','show_messages','show_visitor_tab','show_showcase']

const DEFAULT_ORDER = ['slides','about','virtual-tour','gallery','archive','exclusive','showcase','messages']

const SECTION_ELEMENT_ID = {
  slides:         'home',
  about:          'about',
  'virtual-tour': 'virtual-tour',
  gallery:        'gallery',
  archive:        'archive-section',
  exclusive:      'exclusive-section',
  showcase:       'showcase',
  messages:       'contact',
}

const ELEMENT_URL = {
  home:               '/kurdish/slides',
  about:              '/kurdish/about',
  'virtual-tour':     '/kurdish/virtual-tour',
  gallery:            '/kurdish/gallery',
  'archive-section':  '/kurdish/archive',
  'exclusive-section':'/kurdish/museumactivities',
  showcase:           '/kurdish/socialmedia',
  contact:            '/kurdish/contact',
}

async function fetchVisibilityAndOrder() {
  try {
    const keys = [...SECTION_KEYS, 'section_order']
    const json = await fetch(`/api/settings?keys=${keys.join(',')}`).then(r => r.json())
    const map = json.values || {}
    const vis = Object.fromEntries(SECTION_KEYS.map(k => [k, map[k] !== 'false']))
    let order = DEFAULT_ORDER
    if (map.section_order) {
      try {
        const parsed = JSON.parse(map.section_order)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const missing = DEFAULT_ORDER.filter(id => !parsed.includes(id))
          order = [...parsed, ...missing]
        }
      } catch {}
    }
    return { vis, order }
  } catch {
    return { vis: Object.fromEntries(SECTION_KEYS.map(k => [k, true])), order: DEFAULT_ORDER }
  }
}

// Named export so the catch-all can render this directly with an initialSection
export default function KurdishPageContent({ initialSection = null }) {
  const [activeSection, setActiveSection] = useState(initialSection || 'home')
  const [currentLang, setCurrentLang] = useState('ku')
  const [vis, setVis] = useState(Object.fromEntries(SECTION_KEYS.map(k => [k, true])))
  const [sectionOrder, setSectionOrder] = useState(DEFAULT_ORDER)
  const [dataReady, setDataReady] = useState(false)
  const museumName = useMuseumName()
  // Ref tracks current section without triggering observer re-setup
  const activeSectionRef = useRef(initialSection || 'home')
  // Gate: block URL updates until initial scroll-to-section has completed
  const urlGateRef = useRef(!initialSection)

  useEffect(() => {
    const savedLang = localStorage.getItem('museum-lang')
    if (savedLang) setCurrentLang(savedLang)
    fetchVisibilityAndOrder().then(({ vis: v, order: o }) => {
      setVis(v)
      setSectionOrder(o)
      setDataReady(true)
    })
  }, [])

  // Robust scroll restoration on deep-link refresh.
  // Problem: images in earlier sections shift layout after mount, making
  // el.offsetTop wrong at the moment tryScroll first fires.
  // Solution: use ResizeObserver on <body> to detect any layout change,
  // double-rAF to read coordinates after paint, and keep the IO gate
  // closed until 1200ms after the final scroll lands.
  useEffect(() => {
    if (!initialSection || initialSection === 'home') {
      urlGateRef.current = true
      return
    }

    let settled = false
    let rafId   = null
    let ro      = null

    const commit = () => {
      const el = document.getElementById(initialSection)
      if (!el) return false
      // Reject if the element has no rendered height yet (layout not ready)
      if (el.getBoundingClientRect().height === 0) return false
      if (settled) return true
      settled = true

      if (rafId) cancelAnimationFrame(rafId)

      // Double rAF: first frame commits pending layout work,
      // second reads the now-stable getBoundingClientRect coordinates.
      rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const mobileOffset = window.innerWidth < 768 ? 64 : 0
          const top = window.scrollY + el.getBoundingClientRect().top - mobileOffset
          window.scrollTo({ top, behavior: 'instant' })
          setActiveSection(initialSection)
          activeSectionRef.current = initialSection
          const url = ELEMENT_URL[initialSection]
          if (url) window.history.replaceState(null, '', url)
          // Hold gate closed until layout has fully stabilised post-scroll
          setTimeout(() => { urlGateRef.current = true }, 1200)
          if (ro) ro.disconnect()
        })
      })
      return true
    }

    // ResizeObserver on body fires on every layout shift (image decode, lazy mount).
    // This is the primary trigger — it catches shifts that setTimeout polling misses.
    ro = new ResizeObserver(() => { if (!settled) commit() })
    ro.observe(document.body)

    // window.load is the most reliable signal: all images decoded, final coordinates.
    const onLoad = () => { if (!settled) commit() }
    window.addEventListener('load', onLoad)

    // Attempt immediately — works when the page is already complete (e.g. fast cache).
    commit()

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (ro) ro.disconnect()
      window.removeEventListener('load', onLoad)
    }
  }, [])

  // Open gate when data is ready for no-initialSection path
  useEffect(() => {
    if (dataReady && !initialSection) urlGateRef.current = true
  }, [dataReady])

  useEffect(() => {
    if (currentLang === 'ku') {
      document.body.classList.add('font-kurdish')
      document.documentElement.setAttribute('dir', 'rtl')
      document.documentElement.setAttribute('lang', 'ku')
    } else {
      document.body.classList.remove('font-kurdish')
      document.documentElement.setAttribute('dir', 'ltr')
      document.documentElement.setAttribute('lang', 'en')
    }
  }, [currentLang])

  const handleLangChange = (newLang) => {
    setCurrentLang(newLang)
    localStorage.setItem('museum-lang', newLang)
  }

  const handleSectionClick = (sectionId) => setActiveSection(sectionId)

  useEffect(() => {
    // Debounce replaceState — avoids WebKit SecurityError (>100 calls / 30 s)
    let replaceTimer = null
    const safeReplaceState = (url) => {
      if (replaceTimer) clearTimeout(replaceTimer)
      replaceTimer = setTimeout(() => {
        try { window.history.replaceState(null, '', url) } catch {}
      }, 800)
    }

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) { setActiveSection(hash); activeSectionRef.current = hash }
    }
    window.addEventListener('hashchange', handleHashChange)
    if (window.location.hash) handleHashChange()

    // Every known section element ID, in default scroll order
    const ALL_IDS = ['home', 'about', 'virtual-tour', 'gallery', 'archive-section', 'exclusive-section', 'showcase', 'contact']
    const ratios = Object.fromEntries(ALL_IDS.map(id => [id, 0]))

    const commit = (id) => {
      if (id === activeSectionRef.current) return
      setActiveSection(id)
      activeSectionRef.current = id
      const url = ELEMENT_URL[id]
      if (url) safeReplaceState(url)
    }

    const pick = () => {
      if (!urlGateRef.current) return
      // Home is cheapest to detect via scroll position
      if (window.scrollY < 80) { commit('home'); return }
      let best = null, bestR = 0
      ALL_IDS.forEach(id => { if (ratios[id] > bestR) { bestR = ratios[id]; best = id } })
      if (best && bestR > 0.05) commit(best)
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (!urlGateRef.current) return
        entries.forEach(e => { ratios[e.target.id] = e.intersectionRatio })
        pick()
      },
      {
        root: null,
        // Trigger when a section occupies the middle band of the viewport
        rootMargin: '-30% 0px -45% 0px',
        threshold: [0, 0.05, 0.1, 0.25, 0.5, 0.75, 1],
      }
    )

    const observed = new Set()
    const tryObserve = () => {
      ALL_IDS.forEach(id => {
        if (observed.has(id)) return
        const el = document.getElementById(id)
        if (el) { io.observe(el); observed.add(id) }
      })
    }
    tryObserve()

    // MutationObserver picks up lazy-loaded sections the moment they mount
    const mutObs = new MutationObserver(tryObserve)
    mutObs.observe(document.body, { childList: true, subtree: true })

    // Lightweight scroll handler — only needed for home detection at very top
    const onScroll = () => {
      if (!urlGateRef.current) return
      if (window.scrollY < 80) commit('home')
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      if (replaceTimer) clearTimeout(replaceTimer)
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('scroll', onScroll)
      io.disconnect()
      mutObs.disconnect()
    }
  }, [])

  const sectionComponents = {
    slides:         vis.show_slides             ? <Slider key="slides" currentLang={currentLang} />                                 : null,
    about:          vis.show_about              ? <About key="about" currentLang={currentLang} />                                   : null,
    'virtual-tour':                               <VRSection key="virtual-tour" currentLang={currentLang} />,
    gallery:        vis.show_gallery            ? <Gallery key="gallery" currentLang={currentLang} />                              : null,
    archive:        vis.show_archive            ? <ArchivePreview key="archive" currentLang={currentLang} />                       : null,
    exclusive:      vis.show_exclusive          ? <ExclusiveSection key="exclusive" currentLang={currentLang} />                   : null,
    showcase:       vis.show_showcase !== false ? <ShowcaseCards key="showcase" currentLang={currentLang} />                       : null,
    messages:       vis.show_messages           ? <ContactForm key="messages" currentLang={currentLang} />                         : null,
  }

  return (
    <main
      dir="rtl"
      className={`pt-16 md:pt-0 ${currentLang === 'ku' ? 'font-kurdish' : ''}`}
      style={{ overflowAnchor: 'none' }}
    >
      {/* Disable browser scroll-anchoring and smooth-scroll globally during mount
          so our explicit scrollTo coords are never fought by the browser engine */}
      <style>{`html,body{overflow-anchor:none;scroll-behavior:auto!important}`}</style>
      <Sidebar
        activeSection={activeSection}
        onSectionClick={handleSectionClick}
        currentLang={currentLang}
        onLangChange={handleLangChange}
      />
      {sectionOrder.map(id => sectionComponents[id] ?? null)}
      <footer className="pt-6 text-white text-center" style={{ background: '#000000', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
        <p>{currentLang === 'ku' ? ` ${museumName.kr} -    © ٢٠٢٦` : `© 2026 ${museumName.en}. All rights reserved.`}</p>
      </footer>
    </main>
  )
}

