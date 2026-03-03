'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Slider from '../components/Slider'
import About from '../components/About'
import ArchivePreview from '../components/ArchivePreview'
import VRSection from '../components/VRSection'
import Gallery from '../components/Gallery'
import ContactForm from '../components/ContactForm'

export default function KurdishPage() {
  const [activeSection, setActiveSection] = useState('home')
  const [currentLang, setCurrentLang] = useState('ku')

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('museum-lang')
    if (savedLang) {
      setCurrentLang(savedLang)
    }
  }, [])

  // Apply Kurdish font class and direction to body when language changes
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

  // Function to handle language change
  const handleLangChange = (newLang) => {
    setCurrentLang(newLang)
    localStorage.setItem('museum-lang', newLang)
  }

  // Function to manually set active section (for instant click feedback)
  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId)
  }

  // Track scroll position to update active section
  useEffect(() => {
    // Handle hash changes from URL
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) {
        setActiveSection(hash)
      }
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    
    // Check initial hash
    if (window.location.hash) {
      handleHashChange()
    }

    // Fallback: Check scroll position
    const handleScroll = () => {
      if (window.scrollY < 100) {
        setActiveSection('home')
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    handleScroll()

    // Exact order: home, about, virtual-tour, gallery, archive-section, contact
    const sections = ['home', 'about', 'virtual-tour', 'gallery', 'archive-section', 'contact']
    
    const sectionRatios = {}
    sections.forEach(id => sectionRatios[id] = 0)
    
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
      
      sections.forEach((sectionId) => {
        if (sectionRatios[sectionId] > maxRatio) {
          maxRatio = sectionRatios[sectionId]
          maxSection = sectionId
        }
      })
      
      if (maxRatio > 0.1) {
        setActiveSection(maxSection)
      }
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('scroll', handleScroll)
      sections.forEach((sectionId) => {
        const element = document.getElementById(sectionId)
        if (element) {
          observer.unobserve(element)
        }
      })
    }
  }, [activeSection])

  return (
    <main dir="rtl" className={currentLang === 'ku' ? 'font-kurdish' : ''}>
      {/* Sidebar only - removed duplicate Navbar */}
      <Sidebar 
        activeSection={activeSection} 
        onSectionClick={handleSectionClick} 
        currentLang={currentLang} 
        onLangChange={handleLangChange} 
      />
      <Slider currentLang={currentLang} />
      <About currentLang={currentLang} />
      
      {/* VR Section - New YouTube Embed */}
      <VRSection currentLang={currentLang} />
      
      <Gallery currentLang={currentLang} />
      <ArchivePreview currentLang={currentLang} />
      <ContactForm currentLang={currentLang} />
      
      {/* Footer */}
      <footer className="py-6 bg-black text-white text-center">
        <p>{currentLang === 'ku' ? '© ٢٠٢٥ مۆزەخانەی نیشتمانی ئەمنە سورەکە. هەموو مافەکان پارێزراوە.' : '© 2025 Amna Suraka National Museum. All rights reserved.'}</p>
      </footer>
    </main>
  )
}
