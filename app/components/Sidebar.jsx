'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Sidebar({ activeSection = 'home', onSectionClick }) {
  const [hoveredItem, setHoveredItem] = useState(null)

  // Exact order: home(0), about(1), virtual-tour(2), gallery(3), contact(4)
  const menuItems = [
    { id: 'home', icon: 'ri-home-6-line', title: 'Home' },
    { id: 'about', icon: 'ri-profile-line', title: 'About' },
    { id: 'virtual-tour', icon: 'ri-eye-2-line', title: 'VR Tour' },
    { id: 'gallery', icon: 'ri-image-line', title: 'Gallery' },
    { id: 'contact', icon: 'ri-contacts-book-3-line', title: 'Contact' },
  ]

  // Get index from array - ensures correct mapping
  const currentIndex = menuItems.findIndex(item => item.id === activeSection)
  
  // Debug log
  console.log("Active Section:", activeSection, "Index:", currentIndex)
  
  // Calculate top position: (index * 70) + offset to center 45px circle in 70px space
  // offset = (70 - 45) / 2 = 12.5px
  const getIndicatorTop = () => {
    if (currentIndex < 0) return 12.5 // Default to first item
    return (currentIndex * 70) + 12.5
  }

  // Handle click - set active immediately and scroll with offset
  const handleClick = (sectionId) => {
    if (onSectionClick) {
      onSectionClick(sectionId)
    }
    
    // Smooth scroll with offset to account for header (80px)
    const element = document.getElementById(sectionId)
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      })
    }
  }

  return (
    <>
      {/* Sidebar - fixed left vertical navigation */}
      <div 
        className="fixed z-[999] flex flex-col items-center bg-black/60 backdrop-blur-md rounded-r-[30px] w-[50px] max-[850px]:left-1 max-[850px]:bottom-[430px] max-[850px]:top-auto"
        style={{ 
          left: '1px', 
          top: '50%', 
          transform: 'translateY(-50%)',
          paddingTop: '50px',
          height: 'auto'
        }}
      >
        
        {/* Logo at top */}
        <div 
          className="absolute flex items-center justify-center"
          style={{ top: '10px', left: '0', right: '0' }}
        >
          <Link href="/index.html">
            <img 
              src="/assets/images/Flag_of_Kurdistan.png" 
              alt="Kurdistan Flag" 
              className="w-[28px] h-[28px] rounded-full object-cover cursor-pointer"
            />
          </Link>
        </div>

        {/* Menu Container */}
        <div className="relative flex flex-col items-center">
          
          {/* Red Indicator Circle */}
          <div 
            className={`absolute w-[45px] h-[45px] rounded-full pointer-events-none transition-all duration-[600ms] ease-out ${currentIndex >= 0 ? 'opacity-100' : 'opacity-0'}`}
            style={{ 
              top: `${getIndicatorTop()}px`,
              background: 'radial-gradient(circle, #ff0000 0%, #330000 100%)',
              zIndex: 0,
              transform: 'translateX(-50%)',
              left: '50%',
              boxShadow: '0 0 15px rgba(255,0,0,0.6)'
            }}
          />

          {/* Menu Items */}
          <ul className="flex flex-col">
            {menuItems.map((item, idx) => (
              <li 
                key={item.id}
                className="group relative h-[70px] w-[50px] list-none flex items-center justify-center cursor-pointer"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleClick(item.id)}
              >
                <span 
                  className="text-[1.5em] text-center transition-all duration-300"
                  style={{ 
                    color: activeSection === item.id ? 'white' : 'rgba(255,255,255,0.5)',
                    transform: activeSection === item.id ? 'scale(1.1)' : 'scale(1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className={item.icon}></i>
                </span>
                
                {/* Tooltip */}
                <span 
                  className="absolute left-[60px] bg-[#333] text-white text-[9px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                >
                  {item.title}
                </span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </>
  )
}
