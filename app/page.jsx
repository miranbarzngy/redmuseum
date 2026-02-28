'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './components/Sidebar'
import Slider from './components/Slider'
import About from './components/About'
import VRSection from './components/VRSection'
import Gallery from './components/Gallery'
import ContactForm from './components/ContactForm'

export default function Home() {
  const [activeSection, setActiveSection] = useState('home')
  const [currentLang, setCurrentLang] = useState('en')
  const router = useRouter()

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('museum-lang')
    if (savedLang) {
      setCurrentLang(savedLang)
    }
  }, [])

  // Apply Kurdish font class to body when language changes
  useEffect(() => {
    if (currentLang === 'ku') {
      document.body.classList.add('font-kurdish')
    } else {
      document.body.classList.remove('font-kurdish')
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

  useEffect(() => {
    // Fallback: Check scroll position to ensure 'Home' is active at top of page
    const handleScroll = () => {
      if (window.scrollY < 100) {
        setActiveSection('home')
      }
    }
    
    // Add scroll listener as fallback for top-of-page detection
    window.addEventListener('scroll', handleScroll)
    
    // Run once on mount to set initial state
    handleScroll()

    // Exact order: home(0), about(1), virtual-tour(2), gallery(3), contact(4)
    const sections = ['home', 'about', 'virtual-tour', 'gallery', 'contact']
    
    // Track intersection ratios for all sections
    const sectionRatios = {}
    sections.forEach(id => sectionRatios[id] = 0)
    
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -20% 0px', // Focus on middle 60% of viewport
      threshold: [0, 0.25, 0.5, 0.75, 1.0] // More data points
    }

    const observerCallback = (entries) => {
      // Only update if not at top of page (prevents Home/About conflict)
      if (window.scrollY < 100) return
      
      // Update ratios for all intersecting sections
      entries.forEach((entry) => {
        sectionRatios[entry.target.id] = entry.intersectionRatio
      })
      
      // Find the section with the HIGHEST intersection ratio
      let maxRatio = 0
      let maxSection = activeSection // Keep current if no clear winner
      
      sections.forEach((sectionId) => {
        if (sectionRatios[sectionId] > maxRatio) {
          maxRatio = sectionRatios[sectionId]
          maxSection = sectionId
        }
      })
      
      // Debug log
      console.log("Section ratios:", Object.entries(sectionRatios).map(([id, ratio]) => `${id}: ${ratio.toFixed(2)}`).join(", "), "-> Active:", maxSection)
      
      // Only update if there's a clear winner (ratio > 0.1)
      if (maxRatio > 0.1) {
        setActiveSection(maxSection)
      }
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    // Observe all sections
    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
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
    <main className={currentLang === 'ku' ? 'font-kurdish' : ''}>
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
      <ContactForm currentLang={currentLang} />
      
      {/* Footer */}
      <footer className="py-6 bg-black text-white text-center">
        <p>{currentLang === 'ku' ? '© ٢٠٢٥ مۆزەخانەی نیشتمانی ئەمنە سورەکە. هەموو مافەکان پارێزراوە.' : '© 2025 Amna Suraka National Museum. All rights reserved.'}</p>
      </footer>
    </main>
  )
}
