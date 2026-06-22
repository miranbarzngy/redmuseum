'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase-client'

const STAT_ICONS = {
  visitors: 'ri-user-line',
  archives: 'ri-archive-line',
  museums:  'ri-building-line',
}

export default function About({ currentLang = 'en' }) {
  const isKu = currentLang === 'ku'
  const isAr = currentLang === 'ar'
  const font = isKu ? { fontFamily: 'UniSalar, Tahoma, sans-serif' }
             : isAr ? { fontFamily: 'ArabicFont, Tahoma, sans-serif' }
             : {}

  const [counters, setCounters] = useState({ museums: 0, archives: 0, visitors: 0 })
  const [settings, setSettings] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => { fetchSettings() }, [])

  const animateCounter = (id, target) => {
    let current = 0
    const increment = target / 80
    const iv = setInterval(() => {
      current += increment
      if (current >= target) { clearInterval(iv); current = target }
      setCounters(p => ({ ...p, [id]: Math.floor(current) }))
    }, 20)
  }

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').single()
      if (data) {
        setSettings(data)
        animateCounter('museums',  data.museums_count  || 11)
        animateCounter('archives', data.archives_count || 1900)
        animateCounter('visitors', data.visitors_count || 900)
      } else {
        animateCounter('museums', 11); animateCounter('archives', 1900); animateCounter('visitors', 900)
      }
    } catch {
      animateCounter('museums', 11); animateCounter('archives', 1900); animateCounter('visitors', 900)
    } finally { setLoading(false) }
  }


  const get = (field) => {
    if (!settings) return null
    if (isAr)  return settings[`${field}_ar`] || settings[`${field}_kr`] || settings[field] || ''
    if (isKu)  return settings[`${field}_kr`] || settings[field] || ''
    return settings[field] || ''
  }

  const title = get('about_title') || (isKu ? 'تا لە یادمان نەچێت' : isAr ? 'لن ننسى' : 'Not To Be Forgotten')
  const desc  = get('about_text')  || (
    isKu ? 'سەردانمان بکەن بۆ بینینی چەندین مۆزەی تایبەت بە مێژووی جینۆسایدی کورد. هەر مۆزەیەک پێناسەیە بۆ بەشێک لەو چیرۆکە خۆڕاگرییانەی گەلی کورد. لەگەڵمان بن لە پاراستنی ئەم مێژووە.'
    : isAr ? 'زورنا لاستكشاف المتاحف المخصصة لتاريخ الإبادة الجماعية الكردية. كل معرض يكرم صمود وقصص الشعب الكردي. انضموا إلينا للحفاظ على هذا التاريخ.'
    : 'Visit us to explore multiple museums dedicated to the profound history of the Kurdish genocide. Each exhibit honors the resilience and stories of the Kurdish people. Join us in preserving this history.'
  )

  const stats = [
    { key: 'visitors', value: counters.visitors, label: isAr ? 'الزوار سنوياً' : isKu ? 'سەردانیکەر ساڵانە' : 'Visitors Yearly', icon: STAT_ICONS.visitors },
    { key: 'archives', value: counters.archives, label: isAr ? 'قطعة أرشيف'    : isKu ? 'پارچە ئەرشیف'       : 'Archive Pieces',  icon: STAT_ICONS.archives },
    { key: 'museums',  value: counters.museums,  label: isAr ? 'المتاحف'        : isKu ? 'مۆزە'              : 'Museums',         icon: STAT_ICONS.museums  },
  ]

  const bgColor = settings?.about_bg_color || '#ffffff'

  if (loading) return (
    <section id="about" className="min-h-[400px] flex items-center justify-center" style={{ background: bgColor }}>
      <div className="w-10 h-10 border-2 border-[#7a0000] border-t-transparent rounded-full animate-spin" />
    </section>
  )

  return (
    <section id="about" className="h-[calc(100dvh-4rem)] md:h-screen overflow-hidden flex flex-col justify-between py-6 md:py-10" style={{ background: bgColor }}>
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col flex-1 justify-between">

        {/* Decorative top line */}
        <div className="flex items-center gap-0" style={{ opacity: 1 }}>
          <div className="flex-1 h-0.5 rounded-full" style={{ background: 'linear-gradient(to right, transparent, #c8a96e)' }} />
          <div className="w-1.5 h-1.5 rounded-full mx-2" style={{ background: '#c8a96e' }} />
          <div className="flex-1 h-0.5 rounded-full" style={{ background: 'linear-gradient(to left, transparent, #c8a96e)' }} />
        </div>

        {/* Main content — distributes available space evenly */}
        <div className="flex flex-col items-center justify-around flex-1 py-4 gap-y-2 md:gap-y-4 max-w-4xl mx-auto w-full">

          {/* Logo */}
          <img
            src="/assets/images/amnasuraka_logo-removebg-preview.png"
            alt="Amna Suraka Logo"
            className="h-16 md:h-20 lg:h-24 xl:h-28 w-auto object-contain"
          />

          {/* Title + Description */}
          <div className="flex flex-col items-center gap-2 md:gap-3">
            <div className="flex items-center justify-center gap-3">
              <span className="block w-8 md:w-10 h-px" style={{ background: 'linear-gradient(to right, transparent, #c8a96e)' }} />
              <h2 className="text-xl sm:text-3xl md:text-3xl xl:text-5xl font-black text-center leading-snug"
                dir={isAr ? 'rtl' : 'ltr'} style={{ color: '#1a0a0a', ...font }}>
                {title}
              </h2>
              <span className="block w-8 md:w-10 h-px" style={{ background: 'linear-gradient(to left, transparent, #c8a96e)' }} />
            </div>
            <p className="text-xs sm:text-sm md:text-sm xl:text-base leading-relaxed text-center max-w-2xl"
              dir={isAr ? 'rtl' : 'ltr'} style={{ color: '#3a2a2a', ...font }}>
              {desc}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 xl:gap-6 w-full">
            {stats.map(s => (
              <div key={s.key}
                className="relative flex flex-col items-center gap-1.5 md:gap-2 py-3 md:py-5 px-2 md:px-3 xl:px-4 rounded-xl md:rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(122,0,0,0.06) 0%, rgba(255,255,255,0) 100%)',
                  border: '1px solid rgba(122,0,0,0.12)',
                  boxShadow: '0 4px 24px rgba(122,0,0,0.06)',
                }}>
                <div className="absolute top-0 left-1/4 right-1/4 h-px"
                  style={{ background: 'linear-gradient(to right, transparent, #c8a96e, transparent)' }} />
                <div className="w-6 h-6 md:w-8 md:h-8 xl:w-10 xl:h-10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(122,0,0,0.1)', border: '1px solid rgba(122,0,0,0.2)' }}>
                  <i className={`${s.icon} text-xs md:text-sm xl:text-lg`} style={{ color: '#7a0000' }} />
                </div>
                <div className="text-xl md:text-3xl xl:text-5xl font-black leading-none"
                  style={{ color: '#7a0000', fontVariantNumeric: 'tabular-nums' }}>
                  {s.value.toLocaleString()}
                </div>
                <div className="text-[9px] md:text-xs xl:text-sm text-center leading-snug" style={{ color: '#5a3a3a', ...font }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Decorative bottom line */}
        <div className="flex items-center gap-0" style={{ opacity: 1 }}>
          <div className="flex-1 h-0.5 rounded-full" style={{ background: 'linear-gradient(to right, transparent, #c8a96e)' }} />
          <div className="w-1.5 h-1.5 rounded-full mx-2" style={{ background: '#c8a96e' }} />
          <div className="flex-1 h-0.5 rounded-full" style={{ background: 'linear-gradient(to left, transparent, #c8a96e)' }} />
        </div>

      </div>
    </section>
  )
}
