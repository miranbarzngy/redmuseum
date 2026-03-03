'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase-client'

// Default categories as fallback
const defaultCategories = [
  { id: 'documents', name_en: 'Documents', name_ku: 'بەڵگەنامەکان', name_ar: 'المستندات', slug: 'documents' },
  { id: 'letters', name_en: 'Letters', name_ku: 'نامەکان', name_ar: 'الرسائل', slug: 'letters' },
  { id: 'photos', name_en: 'Photos', name_ku: 'وێنە کۆنەکان', name_ar: 'الصور القديمة', slug: 'photos' },
]

// Map old category strings to slugs for backward compatibility
const categoryStringToSlug = {
  'Documents': 'documents',
  'Letters': 'letters',
  'Photos': 'photos'
}

// Helper function to normalize paths
const normalizePath = (path) => {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/')) return path
  return `/${path}`
}

export default function ArchivePreview({ currentLang = 'en' }) {
  const [archive, setArchive] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [categories, setCategories] = useState(defaultCategories)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    if (!supabase) {
      setCategories(defaultCategories)
      return
    }

    try {
      const { data, error } = await supabase
        .from('archive_categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setCategories(data || defaultCategories)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories(defaultCategories)
    }
  }

  useEffect(() => {
    fetchArchive()
  }, [])

  const fetchArchive = async () => {
    if (!supabase) {
      // Use sample data for demo
      setArchive([
        {
          id: '1',
          title_en: 'Anfal Campaign Document',
          title_ku: 'بەڵگەنامەی ئەنفال',
          description_en: 'Historical document from the Anfal campaign',
          description_ku: 'بەڵگەنامەیەکی مێژوویی لە کampaینی ئەنفال',
          category: 'Documents',
          category_id: 'documents',
          image_url: '/assets/images/anfal.png',
          date_created: new Date().toISOString()
        },
        {
          id: '2',
          title_en: 'Letter from 1960s',
          title_ku: 'نامەیەک لە ساڵانی ١٩٦٠',
          description_en: 'Rare letter from the 1960s era',
          description_ku: 'نامەیەکی دەگمەن لە سەردەمی ساڵانی ١٩٦٠',
          category: 'Letters',
          category_id: 'letters',
          image_url: '/assets/images/awenakan.png',
          date_created: new Date().toISOString()
        },
        {
          id: '3',
          title_en: 'Old Photo Collection',
          title_ku: 'کۆمەڵەی وێنە کۆنەکان',
          description_en: 'Collection of rare historical photos',
          description_ku: 'کۆمەڵەیەک لە وێنە مێژووییە دەگمەنەکان',
          category: 'Photos',
          category_id: 'photos',
          image_url: '/assets/images/bg-1.jpg',
          date_created: new Date().toISOString()
        }
      ])
      setLoading(false)
      return
    }

    try {
      // Fetch a larger pool of active records
      const { data, error } = await supabase
        .from('digital_archive')
        .select('*')
        .eq('is_active', true)

      if (error) throw error
      
      // Shuffle and pick 5 random items
      const allItems = data || []
      const shuffled = allItems.sort(() => Math.random() - 0.5)
      setArchive(shuffled.slice(0, 5))
    } catch (error) {
      console.error('Error fetching archive:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-rotate slider
  useEffect(() => {
    if (archive.length <= 1) return
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % archive.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [archive.length])

  // Get category by ID
  const getCategoryById = (categoryId) => {
    return categories.find(c => c.id === categoryId)
  }

  // Get the effective category ID from an item
  const getItemCategoryId = (item) => {
    if (item?.category_id) {
      return item.category_id
    }
    if (item?.category) {
      const slug = categoryStringToSlug[item.category] || item.category.toLowerCase()
      const cat = categories.find(c => c.slug === slug)
      if (cat) return cat.id
    }
    return null
  }

  // Get category display name - fallback to English if Arabic is missing
  const getCategoryName = (item) => {
    const itemCategoryId = getItemCategoryId(item)
    if (itemCategoryId) {
      const cat = getCategoryById(itemCategoryId)
      if (cat) {
        if (currentLang === 'ku') return cat.name_ku || cat.name_en
        if (currentLang === 'ar') return cat.name_ar || cat.name_en
        return cat.name_en
      }
    }
    // Fallback
    if (item?.category) {
      return currentLang === 'ku' ? item.category : (currentLang === 'ar' ? item.category : item.category)
    }
    return ''
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (currentLang === 'ku') {
      return date.toLocaleDateString('ku-KU', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    if (currentLang === 'ar') {
      return date.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const archiveLink = currentLang === 'ku' ? '/kurdish/archive' : (currentLang === 'ar' ? '/arabic/archive' : '/archive')

  // Get the detail page link for an item
  const getDetailLink = (item) => {
    if (currentLang === 'ku') return `/kurdish/archive/${item.id}`
    if (currentLang === 'ar') return `/arabic/archive/${item.id}`
    return `/archive/${item.id}`
  }

  // Get title - priority: title_ar > title_ku > title_en
  const getTitle = (item) => {
    return item.title_ar || item.title_ku || item.title_en || ''
  }

  // Get description - priority: description_ar > description_ku > description_en
  const getDescription = (item) => {
    return item.description_ar || item.description_ku || item.description_en || ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (archive.length === 0) {
    return null
  }

  return (
    <section id="archive-section" className="py-16 bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: currentLang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : (currentLang === 'ar' ? 'Cairo, sans-serif' : 'inherit') }}>
            {currentLang === 'ku' ? 'ئەرشیفی دیجیتاڵی' : (currentLang === 'ar' ? 'الأرشيف الرقمي' : 'Digital Archive')}
          </h2>
          <p className="text-gray-400" style={{ fontFamily: currentLang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : (currentLang === 'ar' ? 'Cairo, sans-serif' : 'inherit') }}>
            {currentLang === 'ku' 
              ? 'بەڵگەنامە و وێنە مێژووییەکان'
              : currentLang === 'ar'
              ? 'المستندات التاريخية والصور النادرة'
              : 'Historical Documents & Rare Photos'}
          </p>
        </div>

        {/* Card Slider */}
        <div className="relative max-w-4xl mx-auto">
          {/* Main Card - Fixed height container */}
          <Link href={getDetailLink(archive[currentIndex])} className="block bg-gray-800 rounded-xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-300">
            <div className="flex flex-col md:flex-row">
              {/* Image - Fixed height with aspect ratio - show entire image */}
              <div className="relative w-full md:w-1/2 h-[300px] md:h-[400px] flex-shrink-0 bg-zinc-900/50 p-4 flex items-center justify-center">
                <img
                  src={normalizePath(archive[currentIndex]?.image_url)}
                  alt={currentLang === 'ku' ? archive[currentIndex]?.title_ku : archive[currentIndex]?.title_en}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.src = '/assets/images/bg-1.jpg'
                  }}
                />
                {/* Fixed position category badge */}
                <span className="absolute top-4 left-4 bg-red-600 text-white text-sm px-3 py-1 rounded z-10">
                  {getCategoryName(archive[currentIndex])}
                </span>
              </div>

              {/* Content - Fixed height to match image */}
              <div className="p-6 md:p-8 flex flex-col justify-center h-[200px] md:h-[400px] overflow-hidden" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 line-clamp-2" style={{ fontFamily: currentLang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : (currentLang === 'ar' ? 'Cairo, sans-serif' : 'inherit') }}>
                  {getTitle(archive[currentIndex])}
                </h3>
                <p className="text-gray-300 mb-3 line-clamp-4 text-sm md:text-base" style={{ fontFamily: currentLang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : (currentLang === 'ar' ? 'Cairo, sans-serif' : 'inherit') }}>
                  {getDescription(archive[currentIndex])}
                </p>
                <p className="text-gray-500 text-sm mt-auto">
                  {formatDate(archive[currentIndex]?.date_created)}
                </p>
              </div>
            </div>
          </Link>

          {/* Navigation Dots */}
          {archive.length > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              {archive.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx === currentIndex ? 'bg-red-600 w-8' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Arrow Navigation */}
          {archive.length > 1 && (
            <>
              <button
                onClick={() => setCurrentIndex((prev) => (prev - 1 + archive.length) % archive.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % archive.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* View All Button */}
        <div className="text-center mt-8">
          <Link
            href={archiveLink}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
            style={{ fontFamily: currentLang === 'ku' ? 'UniSalar, Tahoma, sans-serif' : (currentLang === 'ar' ? 'Cairo, sans-serif' : 'inherit') }}
          >
            {currentLang === 'ku' ? 'بینینی هەموو ئەرشیفەکە' : (currentLang === 'ar' ? 'عرض كل الأرشيف' : 'View All Archive')}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
