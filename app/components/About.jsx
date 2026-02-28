'use client'

import { useEffect, useState } from 'react'

export default function About({ currentLang = 'en' }) {
  const isKurdish = currentLang === 'ku'
  const [counters, setCounters] = useState({ museums: 0, archives: 0, visitors: 0 })

  useEffect(() => {
    const animateCounter = (id, target) => {
      let current = 0
      const increment = target / 100
      const interval = setInterval(() => {
        current += increment
        if (current >= target) {
          clearInterval(interval)
          current = target
        }
        setCounters(prev => ({ ...prev, [id]: Math.floor(current) }))
      }, 30)
    }

    animateCounter('museums', 11)
    animateCounter('archives', 1900)
    animateCounter('visitors', 900)
  }, [])

  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8">
            <img 
              src="/assets/images/amnasuraka_logo-removebg-preview.png" 
              alt="Amna Suraka Logo" 
              className="w-48 h-48 mx-auto object-contain"
            />
          </div>

          {/* Title */}
          <h2 className="text-4xl font-bold mb-6 text-gray-800">
            {isKurdish ? 'تا لە یادمان نەچێت' : 'Not To Be Forgotten'}
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-12 leading-relaxed">
            {isKurdish 
              ? "سەردانمان بکەن بۆ بینینی چەندین مۆزەی تایبەت بە مێژووی جینۆسایدی کورد. هەر مۆزەیەک پێناسەیە بۆ بەشێک لەو چیرۆکە خۆڕاگرییانەی گەلی کورد. لەگەڵمان بن لە پاراستنی ئەم مێژووە."
              : "Visit us to explore multiple museums dedicated to the profound history of the Kurdish genocide. Each exhibit honors the resilience and stories of the Kurdish people. Join us in preserving this history."
            }
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">{counters.museums}</div>
              <div className="text-gray-600">{isKurdish ? 'مۆزە' : 'Museums'}</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">{counters.archives}</div>
              <div className="text-gray-600">{isKurdish ? 'پارچە ئەرشیف' : 'Archives'}</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">{counters.visitors}</div>
              <div className="text-gray-600">{isKurdish ? 'سەردانیکەر' : 'Visitors'}</div>
              <div className="text-sm text-gray-400">{isKurdish ? 'ساڵانە' : 'Yearly'}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
