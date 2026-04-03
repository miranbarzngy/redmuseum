'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getSupabaseClient } from '../lib/supabase-client'

export default function ExclusivePage() {
  const [exclusiveEvent, setExclusiveEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  const currentLang = pathname.startsWith('/kurdish') ? 'ku'
    : pathname.startsWith('/arabic') ? 'ar'
    : 'en'

  useEffect(() => {
    fetchExclusiveEvent()
  }, [])

  const fetchExclusiveEvent = async () => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) { setLoading(false); return }

      const { data, error } = await supabase
        .from('exclusive_events')
        .select('*')
        .eq('is_active', true)
        .single()

      if (error) {
        // Handle table not found or other errors gracefully
        if (error.code === 'PGRST116' || error.message.includes('relation "exclusive_events" does not exist')) {
          // No active events or table doesn't exist - this is expected initially
          setExclusiveEvent(null)
        } else {
          console.error('Error fetching exclusive event:', error)
          setExclusiveEvent(null)
        }
      } else {
        setExclusiveEvent(data || null)
      }
    } catch (error) {
      console.error('Error fetching exclusive event:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading exclusive event...</p>
        </div>
      </div>
    )
  }

  if (!exclusiveEvent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2">
            {currentLang === 'ku' ? 'هیچ ڕووداوی تایبەتی نییە' :
             currentLang === 'ar' ? 'لا يوجد حدث حصري حالياً' : 
             'No Exclusive Event Available'}
          </h1>
          <p className="text-gray-400">
            {currentLang === 'ku' ? 'بەم دوایدا چەند دەستکەوتێکی تایبەت دەست دەکەوێت' : 
             currentLang === 'ar' ? 'سيتم إضافة أحداث حصرية قريباً' : 
             'Stay tuned for exclusive events coming soon!'}
          </p>
        </div>
      </div>
    )
  }

  const getDisplayText = (field) => {
    return currentLang === 'ku' ? exclusiveEvent[field + '_ku'] :
           currentLang === 'ar' ? exclusiveEvent[field + '_ar'] :
           exclusiveEvent[field + '_en']
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="relative h-96 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/50 via-red-600/30 to-transparent"></div>
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div className="max-w-4xl">
            <div className="text-6xl mb-4">⭐</div>
            <h1 
              className="text-5xl md:text-7xl font-bold mb-6"
              style={{ fontFamily: currentLang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : 'inherit' }}
            >
              {getDisplayText('title')}
            </h1>
            <div className="w-24 h-1 bg-red-600 mx-auto"></div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image/Visual */}
          <div className="relative h-96 md:h-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent rounded-2xl"></div>
            <div className="relative h-full flex items-center justify-center">
              <div className="text-9xl opacity-20">📅</div>
              <div className="absolute text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">EXCLUSIVE</div>
                <div className="text-sm uppercase tracking-wider text-gray-400">
                  {currentLang === 'ku' ? 'تایبەت' : 
                   currentLang === 'ar' ? 'حصري' : 
                   'EXCLUSIVE'}
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-8">
            <div>
              <h2 
                className="text-3xl font-bold mb-4"
                style={{ fontFamily: currentLang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : 'inherit' }}
              >
                {currentLang === 'ku' ? 'دەربارەی ڕووداوەکە' : 
                 currentLang === 'ar' ? 'عن الحدث' : 
                 'About This Event'}
              </h2>
              <p 
                className="text-lg text-gray-300 leading-relaxed"
                style={{ fontFamily: currentLang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : 'inherit' }}
              >
                {getDisplayText('description')}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                {currentLang === 'ku' ? 'زانیاری زیاتر' : 
                 currentLang === 'ar' ? 'مزيد من المعلومات' : 
                 'More Information'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="text-red-600 font-semibold mb-2">
                    {currentLang === 'ku' ? 'جۆری ڕووداو' : 
                     currentLang === 'ar' ? 'نوع الحدث' : 
                     'Event Type'}
                  </div>
                  <div className="text-gray-300">
                    {currentLang === 'ku' ? 'تایبەت' : 
                     currentLang === 'ar' ? 'حصري' : 
                     'Exclusive'}
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="text-red-600 font-semibold mb-2">
                    {currentLang === 'ku' ? 'دۆخ' : 
                     currentLang === 'ar' ? 'الحالة' : 
                     'Status'}
                  </div>
                  <div className="text-green-400 font-semibold">ACTIVE</div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            {exclusiveEvent.link && (
              <div className="pt-4">
                <a
                  href={exclusiveEvent.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-8 py-3 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-colors shadow-lg"
                >
                  <span className="mr-2">🔗</span>
                  {currentLang === 'ku' ? 'بڕۆ بۆ گەڕان' : 
                   currentLang === 'ar' ? 'اذهب إلى الرابط' : 
                   'Visit Link'}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-16 text-center">
          <a
            href={currentLang === 'ku' ? '/kurdish' : 
                 currentLang === 'ar' ? '/arabic' : '/'}
            className="inline-flex items-center px-6 py-3 border-2 border-red-600 text-red-600 font-semibold rounded-full hover:bg-red-600 hover:text-white transition-colors"
          >
            <span className="mr-2">←</span>
            {currentLang === 'ku' ? 'گەڕانەوە بۆ سەرەتا' : 
             currentLang === 'ar' ? 'العودة إلى الرئيسية' : 
             'Back to Home'}
          </a>
        </div>
      </main>
    </div>
  )
}