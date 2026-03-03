'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase-client'
import Link from 'next/link'

// Default categories as fallback
const defaultCategories = [
  { id: 'documents', name_en: 'Documents', name_ar: 'المستندات', slug: 'documents' },
  { id: 'letters', name_en: 'Letters', name_ar: 'الرسائل', slug: 'letters' },
  { id: 'photos', name_en: 'Photos', name_ar: 'الصور القديمة', slug: 'photos' },
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

export default function ArabicArchiveDetail() {
  const params = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])

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
    if (params?.id) {
      fetchItem(params.id)
    }
  }, [params?.id])

  const fetchItem = async (id) => {
    setLoading(true)
    setError(null)

    if (!supabase) {
      setError('Supabase not configured')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('digital_archive')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setItem(data)
    } catch (error) {
      console.error('Error fetching archive item:', error)
      setError('Archive item not found')
    } finally {
      setLoading(false)
    }
  }

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

  // Get category display name in Arabic - fallback to English if Arabic is missing
  const getCategoryName = (item) => {
    const itemCategoryId = getItemCategoryId(item)
    if (itemCategoryId) {
      const cat = getCategoryById(itemCategoryId)
      if (cat) return cat.name_ar || cat.name_en
    }
    if (item?.category) {
      const slug = categoryStringToSlug[item.category] || item.category.toLowerCase()
      const cat = categories.find(c => c.slug === slug)
      if (cat) return cat.name_ar || cat.name_en
      return item.category
    }
    return ''
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  // Get title - priority: title_ar > title_ku > title_en
  const getTitle = (item) => {
    return item.title_ar || item.title_ku || item.title_en || ''
  }

  // Get description - priority: description_ar > description_ku > description_en
  const getDescription = (item) => {
    return item.description_ar || item.description_ku || item.description_en || ''
  }

  // Set page metadata
  useEffect(() => {
    if (item) {
      document.title = getTitle(item) || 'Archive Item'
    }
  }, [item])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            الأرشيف غير موجود
          </h1>
          <p className="text-gray-400 mb-6">Archive item not found</p>
          <Link
            href="/arabic/archive"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            العودة إلى الأرشيف
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-arabic" dir="rtl">
      {/* Header */}
      <div className="relative py-12 bg-gradient-to-b from-red-900 to-gray-900">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Link
            href="/arabic/archive"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            العودة إلى الأرشيف
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold">
            {getTitle(item)}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Category Badge */}
          <div className="mb-6">
            <span className="bg-red-600 text-white text-sm px-4 py-2 rounded inline-block">
              {getCategoryName(item)}
            </span>
            {item.date_created && (
              <span className="text-gray-400 mr-4">
                {formatDate(item.date_created)}
              </span>
            )}
          </div>

          {/* Full Image - Using object-contain to show 100% of document */}
          <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl mb-8">
            <div className="relative w-full h-[300px] md:h-[500px] lg:h-[600px] flex items-center justify-center bg-zinc-900/50 p-4">
              <img
                src={normalizePath(item.image_url)}
                alt={getTitle(item)}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = '/assets/images/bg-1.jpg'
                }}
              />
            </div>
          </div>

          {/* Full Description */}
          <div className="bg-gray-800 rounded-xl p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-4">
              {getTitle(item)}
            </h2>
            
            {getDescription(item) && (
              <div className="mb-6">
                <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap" dir="rtl">
                  {getDescription(item)}
                </p>
              </div>
            )}
            
            {/* Download PDF Button */}
            {item.file_url && (
              <div className="mt-8 pt-6 border-t border-gray-700">
                <a
                  href={normalizePath(item.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  تحميل / Download PDF
                </a>
              </div>
            )}
          </div>

          {/* Back to Archive Button */}
          <div className="mt-8 text-center">
            <Link
              href="/arabic/archive"
              className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              عرض جميع الأرشيف
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
