'use client'

import { useState, useEffect } from 'react'
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
  'exclusive-section':'/arabic/exclusive',
  showcase:           '/arabic/showcase',
  contact:            '/arabic/contact',
  reserve:            '/arabic/reserve',
}

async function fetchVisibility() {
  const results = await Promise.all(
    SECTION_KEYS.map(k => fetch(`/api/settings?key=${k}`).then(r => r.json()).catch(() => ({ value: null })))
  )
  return Object.fromEntries(SECTION_KEYS.map((k, i) => [k, results[i].value !== 'false']))
}

async function fetchSectionOrder() {
  try {
    const json = await fetch('/api/settings?key=section_order').then(r => r.json())
    if (json.value) {
      const parsed = JSON.parse(json.value)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const missing = DEFAULT_ORDER.filter(id => !parsed.includes(id))
        return [...parsed, ...missing]
      }
    }
  } catch {}
  return DEFAULT_ORDER
}

export function ArabicPageContent({ initialSection = null }) {
  const [activeSection, setActiveSection] = useState(initialSection || 'home')
  const [currentLang, setCurrentLang] = useState('ar')
  const [vis, setVis] = useState(Object.fromEntries(SECTION_KEYS.map(k => [k, true])))
  const [sectionOrder, setSectionOrder] = useState(DEFAULT_ORDER)
  const [dataReady, setDataReady] = useState(false)

  useEffect(() => {
    const savedLang = localStorage.getItem('museum-lang')
    if (savedLang) setCurrentLang(savedLang)
    Promise.all([fetchVisibility(), fetchSectionOrder()]).then(([v, o]) => {
      setVis(v)
      setSectionOrder(o)
      setDataReady(true)
    })
  }, [])

  // Scroll to initialSection once data and DOM are ready
  useEffect(() => {
    if (!dataReady || !initialSection) return
    const tryScroll = (attempts = 0) => {
      if (initialSection === 'home') {
        window.scrollTo({ top: 0, behavior: 'instant' })
        setActiveSection('home')
        window.history.replaceState(null, '', '/arabic/slides')
        return
      }
      const el = document.getElementById(initialSection)
      if (el) {
        window.scrollTo({ top: el.offsetTop - 80, behavior: 'instant' })
        setActiveSection(initialSection)
        const url = ELEMENT_URL[initialSection]
        if (url) window.history.replaceState(null, '', url)
      } else if (attempts < 20) {
        setTimeout(() => tryScroll(attempts + 1), 100)
      }
    }
    tryScroll()
  }, [dataReady, initialSection])

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
      if (hash) setActiveSection(hash)
    }
    window.addEventListener('hashchange', handleHashChange)
    if (window.location.hash) handleHashChange()

    const handleScroll = () => {
      if (window.scrollY < 100) {
        setActiveSection('home')
        window.history.replaceState(null, '', '/arabic/slides')
      }
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll()

    const observableIds = ['about', 'virtual-tour', 'gallery', 'archive-section', 'exclusive-section', 'showcase', 'contact', 'reserve']
    const sectionRatios = {}
    observableIds.forEach(id => sectionRatios[id] = 0)

    const observer = new IntersectionObserver((entries) => {
      if (window.scrollY < 100) return
      entries.forEach(entry => { sectionRatios[entry.target.id] = entry.intersectionRatio })
      let maxRatio = 0, maxSection = activeSection
      observableIds.forEach(id => {
        if (sectionRatios[id] > maxRatio) { maxRatio = sectionRatios[id]; maxSection = id }
      })
      if (maxRatio > 0.1) {
        setActiveSection(maxSection)
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
      observableIds.forEach(id => {
        const el = document.getElementById(id)
        if (el) observer.unobserve(el)
      })
    }
  }, [activeSection])

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
      <footer className="py-6 bg-black text-white text-center">
        <p>© ٢٠٢٥ المتحف الوطني أمضى سورەكە. جميع الحقوق محفوظة.</p>
      </footer>
    </main>
  )
}

export default function ArabicPage() {
  return <ArabicPageContent />
}
