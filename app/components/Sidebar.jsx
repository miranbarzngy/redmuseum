'use client'

import { useState, useEffect } from 'react'

export default function Sidebar({ activeSection = 'home', onSectionClick, currentLang = 'en', onLangChange }) {
  const [hoveredItem, setHoveredItem] = useState(null)
  const [currentHash, setCurrentHash] = useState('')

  // Track URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) {
        setCurrentHash(hash)
      }
    }

    // Initial check
    handleHashChange()
    
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Get menu items based on language
  const menuItems = currentLang === 'ku'
    ? [
        { id: 'home', icon: 'ri-home-6-line', title: 'سەرەتا', href: '/kurdish' },
        { id: 'about', icon: 'ri-profile-line', title: 'دەربارە', href: '/kurdish#about' },
        { id: 'virtual-tour', icon: 'ri-eye-2-line', title: 'بینینی ٣٦٠', href: '/kurdish#virtual-tour' },
        { id: 'gallery', icon: 'ri-image-line', title: 'گەلەری', href: '/kurdish#gallery' },
        { id: 'archive-section', icon: 'ri-archive-line', title: 'ئەرشیف', href: '/kurdish#archive-section' },
        { id: 'contact', icon: 'ri-contacts-book-3-line', title: 'پەیوەندی', href: '/kurdish#contact' },
      ]
    : [
        { id: 'home', icon: 'ri-home-6-line', title: 'Home', href: '/' },
        { id: 'about', icon: 'ri-profile-line', title: 'About', href: '/#about' },
        { id: 'virtual-tour', icon: 'ri-eye-2-line', title: 'VR Tour', href: '/#virtual-tour' },
        { id: 'gallery', icon: 'ri-image-line', title: 'Gallery', href: '/#gallery' },
        { id: 'archive-section', icon: 'ri-archive-line', title: 'Archive', href: '/#archive-section' },
        { id: 'contact', icon: 'ri-contacts-book-3-line', title: 'Contact', href: '/#contact' },
      ]

  // Determine if an item is active - check both activeSection prop and currentHash
  const isActive = (itemId) => {
    return activeSection === itemId || currentHash === itemId
  }

  // Get index from array - ensures correct mapping using isActive
  const currentIndex = menuItems.findIndex(item => isActive(item.id))
  
  // Calculate top position for indicator
  const getIndicatorTop = () => {
    if (currentIndex < 0) return 12.5
    return (currentIndex * 70) + 12.5
  }

  // Handle click - set active immediately and scroll with offset
  const handleClick = (item) => {
    if (onSectionClick) {
      onSectionClick(item.id)
    }
    
    // Smooth scroll with offset to account for header (80px)
    const element = document.getElementById(item.id)
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      })
    }
  }

  // Handle language toggle - navigate to correct route
  const toggleLanguage = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const newLang = currentLang === 'en' ? 'ku' : 'en'
    if (onLangChange) {
      onLangChange(newLang)
    }
    // Navigate to the appropriate page
    if (newLang === 'ku') {
      window.location.href = '/kurdish'
    } else {
      window.location.href = '/'
    }
  }

  return (
    <>
      {/* Sidebar - fixed left vertical navigation */}
      <div 
        className="fixed z-[999] flex flex-col items-center bg-black/80 backdrop-blur-md rounded-r-2xl"
        style={{ 
          left: '0', 
          top: '50%', 
          transform: 'translateY(-50%)',
          paddingTop: '12px',
          paddingBottom: '12px',
          width: '60px',
          height: 'auto'
        }}
      >
        
        {/* Language Switcher - Flag at top with prominent styling */}
        <div 
          className="flex items-center justify-center mb-3 cursor-pointer group"
          onClick={toggleLanguage}
          title={currentLang === 'en' ? 'Switch to Kurdish / گۆڕین بە کوردی' : 'Switch to English / گۆڕین بە ئینگلیزی'}
        >
          <div className="relative">
            <img 
              src={currentLang === 'en' ? '/assets/images/Flag_of_Kurdistan.png' : '/assets/images/english flag.jpg'}
              alt={currentLang === 'en' ? 'Kurdistan Flag' : 'English Flag'} 
              className="w-8 h-8 rounded-full object-cover cursor-pointer hover:scale-125 transition-all duration-300 shadow-lg border-2 border-white/30"
            />
            {/* Tooltip for language */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {currentLang === 'en' ? 'کوردی' : 'English'}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-10 h-px bg-white/20 mb-2"></div>

        {/* Menu Container */}
        <div className="relative flex flex-col items-center">
          
          {/* Red Indicator Circle */}
          <div 
            className={`absolute w-[48px] h-[48px] rounded-full pointer-events-none transition-all duration-[600ms] ease-out ${currentIndex >= 0 ? 'opacity-100' : 'opacity-0'}`}
            style={{ 
              top: `${getIndicatorTop()}px`,
              background: 'radial-gradient(circle, #dc2626 0%, #991b1b 100%)',
              zIndex: 0,
              transform: 'translateX(-50%)',
              left: '50%',
              boxShadow: '0 0 20px rgba(220, 38, 38, 0.6)'
            }}
          />

          {/* Menu Items */}
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
                    fontSize: '26px',
                    color: isActive(item.id) ? '#ffffff' : 'rgba(255,255,255,0.5)',
                    transform: isActive(item.id) ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  <i className={item.icon}></i>
                </span>
                
                {/* Tooltip - appears on hover */}
                <span 
                  className={`absolute left-[70px] bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap transition-all duration-300 pointer-events-none z-50 ${
                    hoveredItem === item.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                  }`}
                  style={{ 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    fontFamily: currentLang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : 'inherit'
                  }}
                >
                  {item.title}
                </span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Mobile Bottom Bar - appears on small screens */}
      <div className="fixed bottom-0 left-0 right-0 z-[999] bg-black/90 backdrop-blur-md md:hidden flex justify-around items-center py-3 px-4">
        {/* Mobile Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="flex flex-col items-center"
        >
          <img 
            src={currentLang === 'en' ? '/assets/images/Flag_of_Kurdistan.png' : '/assets/images/english flag.jpg'}
            alt="Language" 
            className="w-6 h-6 rounded-full object-cover"
          />
        </button>

        {/* Mobile Nav Items */}
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item)}
            className="flex flex-col items-center"
          >
            <span 
              className="text-xl"
              style={{ 
                color: isActive(item.id) ? '#dc2626' : 'rgba(255,255,255,0.6)',
              }}
            >
              <i className={item.icon}></i>
            </span>
            <span className="text-[10px] mt-1 text-white/70">{item.title}</span>
          </button>
        ))}
      </div>
    </>
  )
}
