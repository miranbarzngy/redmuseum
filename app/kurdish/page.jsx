'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Slider from '../components/Slider'
import About from '../components/About'
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
      <ContactForm currentLang={currentLang} />
      
      {/* Footer */}
      <footer className="py-6 bg-black text-white text-center">
        <p>{currentLang === 'ku' ? '© ٢٠٢٥ مۆزەخانەی نیشتمانی ئەمنە سورەکە. هەموو مافەکان پارێزراوە.' : '© 2025 Amna Suraka National Museum. All rights reserved.'}</p>
      </footer>
    </main>
  )
}
