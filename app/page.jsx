'use client'

import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Slider from './components/Slider'
import About from './components/About'
import Gallery from './components/Gallery'
import ContactForm from './components/ContactForm'

export default function Home() {
  const [activeSection, setActiveSection] = useState('home')

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
    <main>
      <Navbar currentLang="en" />
      <Sidebar activeSection={activeSection} onSectionClick={handleSectionClick} />
      <Slider currentLang="en" />
      <About currentLang="en" />
      
      {/* Virtual Tour Section */}
      <section id="virtual-tour" className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-white mb-8">
            Explore Our Place in 360°
          </h2>
          <p className="text-center text-gray-300 mb-8">
            Experience a virtual tour of our location!
          </p>
          <div className="max-w-4xl mx-auto">
            <iframe 
              src="https://cdn.pannellum.org/2.5/pannellum.htm#panorama=https://pannellum.org/images/alma.jpg"
              className="w-full h-96 rounded-lg"
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>
      
      <Gallery currentLang="en" />
      <ContactForm currentLang="en" />
      
      {/* Footer */}
      <footer className="py-6 bg-black text-white text-center">
        <p>© 2025 Amna Suraka National Museum. All rights reserved.</p>
      </footer>
    </main>
  )
}
