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

const SECTION_KEYS = ['show_slides','show_about','show_gallery','show_archive','show_activities','show_exclusive','show_messages','show_visitor_tab']

const DEFAULT_ORDER = ['slides','about','virtual-tour','gallery','archive','exclusive','messages','reserve']

// Maps section-order key → HTML element ID (used by observer & URL)
const SECTION_ELEMENT_ID = {
  slides:         'home',
  about:          'about',
  'virtual-tour': 'virtual-tour',
  gallery:        'gallery',
  archive:        'archive-section',
  exclusive:      'exclusive-section',
  messages:       'contact',
  reserve:        'reserve',
}

// Maps HTML element ID → URL path segment
const ELEMENT_URL = {
  home:               '/arabic',
  about:              '/arabic/about',
  'virtual-tour':     '/arabic/virtual-tour',
  gallery:            '/arabic/gallery',
  'archive-section':  '/arabic/archive',
  'exclusive-section':'/arabic/exclusive',
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

export default function ArabicPage() {
  const [activeSection, setActiveSection] = useState('home')
  const [currentLang, setCurrentLang] = useState('ar')
  const [vis, setVis] = useState(Object.fromEntries(SECTION_KEYS.map(k => [k, true])))
  const [sectionOrder, setSectionOrder] = useState(DEFAULT_ORDER)

  // Load language + visibility + section order
  useEffect(() => {
    const savedLang = localStorage.getItem('museum-lang')
    if (savedLang) setCurrentLang(savedLang)
    fetchVisibility().then(setVis)
    fetchSectionOrder().then(setSectionOrder)
  }, [])

  // Apply Arabic font class and direction to body when language changes
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

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId)
  }

  // Track scroll position to update active section + URL
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
        window.history.replaceState(null, '', '/arabic')
      }
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll()

    // All possible element IDs to observe
    const observableIds = ['about', 'virtual-tour', 'gallery', 'archive-section', 'exclusive-section', 'contact', 'reserve']
    const sectionRatios = {}
    observableIds.forEach(id => sectionRatios[id] = 0)

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -20% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1.0]
    }

    const observerCallback = (entries) => {
      if (window.scrollY < 100) return
      entries.forEach((entry) => {
        sectionRatios[entry.target.id] = entry.intersectionRatio
      })
      let maxRatio = 0
      let maxSection = activeSection
      observableIds.forEach((sectionId) => {
        if (sectionRatios[sectionId] > maxRatio) {
          maxRatio = sectionRatios[sectionId]
          maxSection = sectionId
        }
      })
      if (maxRatio > 0.1) {
        setActiveSection(maxSection)
        const url = ELEMENT_URL[maxSection]
        if (url && window.location.pathname !== url) {
          window.history.replaceState(null, '', url)
        }
      }
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)
    observableIds.forEach((sectionId) => {
      const element = document.getElementById(sectionId)
      if (element) observer.observe(element)
    })

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('scroll', handleScroll)
      observableIds.forEach((sectionId) => {
        const element = document.getElementById(sectionId)
        if (element) observer.unobserve(element)
      })
    }
  }, [activeSection])

  // Build component map — evaluated each render so vis/lang are current
  const sectionComponents = {
    slides:         vis.show_slides             ? <Slider key="slides" currentLang={currentLang} />                              : null,
    about:          vis.show_about              ? <About key="about" currentLang={currentLang} />                                : null,
    'virtual-tour':                               <VRSection key="virtual-tour" currentLang={currentLang} />,
    gallery:        vis.show_gallery            ? <Gallery key="gallery" currentLang={currentLang} />                           : null,
    archive:        vis.show_archive            ? <ArchivePreview key="archive" currentLang={currentLang} />                    : null,
    exclusive:      vis.show_exclusive          ? <ExclusiveSection key="exclusive" currentLang={currentLang} />                : null,
    messages:       vis.show_messages           ? <ContactForm key="messages" currentLang={currentLang} />                      : null,
    reserve:        vis.show_visitor_tab !== false ? <ReservePageContent key="reserve" inline initialLang={currentLang} />       : null,
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

      {/* Footer */}
      <footer className="py-6 bg-black text-white text-center">
        <p>© ٢٠٢٥ المتحف الوطني أمضى سورەكە. جميع الحقوق محفوظة.</p>
      </footer>
    </main>
  )
}
