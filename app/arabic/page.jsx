'use client'

import { useState, useEffect, useRef } from 'react'
import { useMuseumName } from '../lib/useMuseumName'
import Sidebar from '../components/Sidebar'
import Slider from '../components/Slider'
import About from '../components/About'
import ArchivePreview from '../components/ArchivePreview'
import VRSection from '../components/VRSection'
import Gallery from '../components/Gallery'
import ContactForm from '../components/ContactForm'
import ExclusiveSection from '../components/ExclusiveSection'
import ReservePageContent from '../components/ReservePageContent'
import ShowcaseCards from '../components/ShowcaseCards'

const SECTION_KEYS = ['show_slides','show_about','show_gallery','show_archive','show_activities','show_exclusive','show_messages','show_visitor_tab','show_showcase']

const DEFAULT_ORDER = ['slides','about','virtual-tour','gallery','archive','exclusive','showcase','messages','reserve']

const SECTION_ELEMENT_ID = {
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

const ELEMENT_URL = {
  home:               '/arabic/slides',
  about:              '/arabic/about',
  'virtual-tour':     '/arabic/virtual-tour',
  gallery:            '/arabic/gallery',
  'archive-section':  '/arabic/archive',
  'exclusive-section':'/arabic/museumactivities',
  showcase:           '/arabic/showcase',
  contact:            '/arabic/contact',
  reserve:            '/arabic/reserve',
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

export function ArabicPageContent({ initialSection = null }) {
  const [activeSection, setActiveSection] = useState(initialSection || 'home')
  const [currentLang, setCurrentLang] = useState('ar')
  const [vis, setVis] = useState(Object.fromEntries(SECTION_KEYS.map(k => [k, true])))
  const [sectionOrder, setSectionOrder] = useState(DEFAULT_ORDER)
  const [dataReady, setDataReady] = useState(false)
  const museumName = useMuseumName()
  const activeSectionRef = useRef(initialSection || 'home')
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

  // Scroll to initialSection immediately on mount
  useEffect(() => {
    if (!initialSection || initialSection === 'home') {
      urlGateRef.current = true
      return
    }
    const tryScroll = (attempts = 0) => {
      const el = document.getElementById(initialSection)
      if (el) {
        window.scrollTo({ top: el.offsetTop - 80, behavior: 'instant' })
        setActiveSection(initialSection)
        activeSectionRef.current = initialSection
        const url = ELEMENT_URL[initialSection]
        if (url) window.history.replaceState(null, '', url)
        setTimeout(() => { urlGateRef.current = true }, 600)
      } else if (attempts < 25) {
        setTimeout(() => tryScroll(attempts + 1), 50)
      }
    }
    tryScroll()
  }, [])

  useEffect(() => {
    if (dataReady && !initialSection) urlGateRef.current = true
  }, [dataReady])

  useEffect(() => {
    if (currentLang === 'ar') {
      document.body.classList.add('font-arabic')
      document.documentElement.setAttribute('dir', 'rtl')
      document.documentElement.setAttribute('lang', 'ar')
    } else {
      document.body.classList.remove('font-arabic')
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
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) { setActiveSection(hash); activeSectionRef.current = hash }
    }
    window.addEventListener('hashchange', handleHashChange)
    if (window.location.hash) handleHashChange()

    const handleScroll = () => {
      if (!urlGateRef.current) return
      if (window.scrollY < 100) {
        setActiveSection('home')
        activeSectionRef.current = 'home'
        window.history.replaceState(null, '', '/arabic/slides')
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    const observableIds = ['about', 'virtual-tour', 'gallery', 'archive-section', 'exclusive-section', 'showcase', 'contact', 'reserve']
    const sectionRatios = {}
    observableIds.forEach(id => sectionRatios[id] = 0)

    const observer = new IntersectionObserver((entries) => {
      if (!urlGateRef.current) return
      if (window.scrollY < 100) return
      entries.forEach(entry => { sectionRatios[entry.target.id] = entry.intersectionRatio })
      let maxRatio = 0, maxSection = activeSectionRef.current
      observableIds.forEach(id => {
        if (sectionRatios[id] > maxRatio) { maxRatio = sectionRatios[id]; maxSection = id }
      })
      if (maxRatio > 0.1) {
        setActiveSection(maxSection)
        activeSectionRef.current = maxSection
        const url = ELEMENT_URL[maxSection]
        if (url && window.location.pathname !== url) window.history.replaceState(null, '', url)
      }
    }, { root: null, rootMargin: '-20% 0px -20% 0px', threshold: [0, 0.25, 0.5, 0.75, 1.0] })

    observableIds.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
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
    reserve:        vis.show_visitor_tab !== false ? <ReservePageContent key="reserve" inline initialLang={currentLang} />          : null,
  }

  return (
    <main dir="rtl" className={currentLang === 'ar' ? 'font-arabic' : ''}>
      <Sidebar
        activeSection={activeSection}
        onSectionClick={handleSectionClick}
        currentLang={currentLang}
        onLangChange={handleLangChange}
      />
      {sectionOrder.map(id => sectionComponents[id] ?? null)}
      <footer className="py-6 text-white text-center" style={{ background: '#7a0000' }}>
        <p>{`© ٢٠٢٥ ${museumName.ar}. جميع الحقوق محفوظة.`}</p>
      </footer>
    </main>
  )
}

export default function ArabicPage() {
  return <ArabicPageContent />
}
