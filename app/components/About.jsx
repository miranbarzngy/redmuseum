'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase-client'

export default function About({ currentLang = 'en' }) {
  const isKurdish = currentLang === 'ku'
  const isArabic = currentLang === 'ar'
  const [counters, setCounters] = useState({ museums: 0, archives: 0, visitors: 0 })
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single()

      if (data) {
        setSettings(data)
        // Animate counters with database values
        animateCounter('museums', data.museums_count || 11)
        animateCounter('archives', data.archives_count || 1900)
        animateCounter('visitors', data.visitors_count || 900)
      } else {
        // Fallback to defaults
        animateCounter('museums', 11)
        animateCounter('archives', 1900)
        animateCounter('visitors', 900)
      }
    } catch (error) {
      console.log('Error fetching settings:', error)
      // Fallback to defaults
      animateCounter('museums', 11)
      animateCounter('archives', 1900)
      animateCounter('visitors', 900)
    } finally {
      setLoading(false)
    }
  }

  // Subscribe to realtime changes for settings table
  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settings'
        },
        (payload) => {
          console.log('Settings change detected:', payload)
          // Refresh settings when any change happens
          fetchSettings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

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

  // Get localized content with fallback: Arabic → Kurdish → English
  const getLocalizedContent = (field) => {
    if (!settings) return null
    if (isArabic) {
      return settings[`${field}_ar`] || settings[`${field}_kr`] || settings[field] || ''
    } else if (isKurdish) {
      return settings[`${field}_kr`] || settings[field] || ''
    }
    return settings[field] || ''
  }

  const title = getLocalizedContent('about_title') || (isKurdish ? 'تا لە یادمان نەچێت' : isArabic ? 'لن ننسى' : 'Not To Be Forgotten')
  const description = getLocalizedContent('about_text') || (isKurdish ? "سەردانمان بکەن بۆ بینینی چەندین مۆزەی تایبەت بە مێژووی جینۆسایدی کورد. هەر مۆزەیەک پێناسەیە بۆ بەشێک لەو چیرۆکە خۆڕاگرییانەی گەلی کورد. لەگەڵمان بن لە پاراستنی ئەم مێژووە." : isArabic ? "زورنا لاستكشاف المتاحف المخصصة لتاريخ الابادة الجماعية الكردية. كل عرض يكرم صمود وقصص الشعب الكردي. انضموا الينا للحفاظ على هذا التاريخ." : "Visit us to explore multiple museums dedicated to the profound history of the Kurdish genocide. Each exhibit honors the resilience and stories of the Kurdish people. Join us in preserving this history.")

  if (loading) {
    return (
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </section>
    )
  }

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
          <h2 
            className="text-4xl font-bold mb-6 text-gray-800"
            dir={isArabic ? 'rtl' : 'ltr'}
            style={{ fontFamily: isArabic ? 'Cairo, Tahoma, sans-serif' : isKurdish ? 'UniSalar, Tahoma, sans-serif' : 'inherit' }}
          >
            {title}
          </h2>

          {/* Description */}
          <p 
            className="text-lg text-gray-600 mb-12 leading-relaxed"
            dir={isArabic ? 'rtl' : 'ltr'}
            style={{ fontFamily: isArabic ? 'Cairo, Tahoma, sans-serif' : isKurdish ? 'UniSalar, Tahoma, sans-serif' : 'inherit' }}
          >
            {description}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">{counters.museums}</div>
              <div className="text-gray-600">{isArabic ? 'المتاحف' : isKurdish ? 'مۆزە' : 'Museums'}</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">{counters.archives}</div>
              <div className="text-gray-600">{isArabic ? 'الأرشيف' : isKurdish ? 'پارچە ئەرشیف' : 'Archives'}</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">{counters.visitors}</div>
              <div className="text-gray-600">{isArabic ? 'الزوار' : isKurdish ? 'سەردانیکەر' : 'Visitors'}</div>
              <div className="text-sm text-gray-400">{isArabic ? 'سنوياً' : isKurdish ? 'ساڵانە' : 'Yearly'}</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
