'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Navbar({ currentLang = 'en', onLangChange }) {
  const [activeItem, setActiveItem] = useState('home')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = currentLang === 'ku' 
    ? [
        { id: 'home', label: 'سەرەتا', href: '#home' },
        { id: 'about', label: 'دەربارە', href: '#about' },
        { id: 'virtual-tour', label: 'بینینی ٣٦٠پلەی', href: '#virtual-tour' },
        { id: 'gallery', label: 'گەلەری', href: '#gallery' },
        { id: 'contact', label: 'پەیوەندی', href: '#contact' },
      ]
    : [
        { id: 'home', label: 'Home', href: '#home' },
        { id: 'about', label: 'About', href: '#about' },
        { id: 'virtual-tour', label: 'VR Tour', href: '#virtual-tour' },
        { id: 'gallery', label: 'Gallery', href: '#gallery' },
        { id: 'contact', label: 'Contact', href: '#contact' },
      ]

  // Handle language toggle
  const toggleLanguage = () => {
    const newLang = currentLang === 'en' ? 'ku' : 'en'
    if (onLangChange) {
      onLangChange(newLang)
    }
  }

  return (
    <nav className={`fixed top-0 left-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-black/80 backdrop-blur-md' : 'bg-transparent'
    }`}>
      <div className="flex items-center justify-between px-4">
        {/* Logo */}
        <Link href="#home" className="p-2" onClick={() => setActiveItem('home')}>
          <img 
            src="/assets/images/amnasuraka_logo-removebg-preview.png"
            alt="Amna Suraka Logo" 
            className="w-10 h-10 object-contain"
          />
        </Link>

        {/* Navigation */}
        <ul className="flex space-x-1">
          {navItems.map((item) => (
            <li 
              key={item.id}
              className={`list ${activeItem === item.id ? 'active' : ''}`}
              data-title={item.label}
            >
              <a 
                href={item.href}
                onClick={() => setActiveItem(item.id)}
                className="flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 hover:bg-white/10"
              >
                <span className="icon">
                  {item.id === 'home' && <i className="ri-home-6-line text-xl"></i>}
                  {item.id === 'about' && <i className="ri-profile-line text-xl"></i>}
                  {item.id === 'virtual-tour' && <i className="ri-eye-2-line text-xl"></i>}
                  {item.id === 'gallery' && <i className="ri-image-line text-xl"></i>}
                  {item.id === 'contact' && <i className="ri-contacts-book-3-line text-xl"></i>}
                </span>
                <span className="circle w-1 h-1 rounded-full bg-white absolute bottom-2 opacity-0 transition-opacity"></span>
              </a>
            </li>
          ))}
        </ul>

        {/* Language Switcher - Flag Toggle */}
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-white/20 rounded hover:bg-white/30 transition-colors cursor-pointer"
          title={currentLang === 'en' ? 'Switch to Kurdish' : 'Switch to English'}
        >
          {/* Show Kurdistan flag when English, UK/USA flag when Kurdish */}
          <img 
            src={currentLang === 'en' ? '/assets/images/Flag_of_Kurdistan.png' : '/assets/images/english flag.jpg'}
            alt={currentLang === 'en' ? 'Kurdistan Flag' : 'English Flag'} 
            className="w-6 h-6 object-cover rounded-full"
          />
          <span className="hidden sm:inline">
            {currentLang === 'en' ? 'کوردی' : 'English'}
          </span>
        </button>
      </div>
    </nav>
  )
}
