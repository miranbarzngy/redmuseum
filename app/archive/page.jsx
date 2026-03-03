'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase-client'
import Link from 'next/link'

// Default categories as fallback
const defaultCategories = [
  { id: 'all', name_en: 'All', name_ku: 'هەموو', slug: 'all' },
  { id: 'documents', name_en: 'Documents', name_ku: 'بەڵگەنامەکان', slug: 'documents' },
  { id: 'letters', name_en: 'Letters', name_ku: 'نامەکان', slug: 'letters' },
  { id: 'photos', name_en: 'Photos', name_ku: 'وێنە کۆنەکان', slug: 'photos' },
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

export default function EnglishArchive() {
  const [categories, setCategories] = useState([])
  const [archive, setArchive] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [lightboxItem, setLightboxItem] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    if (!supabase) {
      console.error('Supabase not configured')
      setCategories(defaultCategories)
      return
    }

    try {
      const { data, error } = await supabase
        .from('archive_categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      
      // Add "All" option at the beginning
      const allOption = { id: 'all', name_en: 'All', name_ku: 'هەموو', slug: 'all' }
      if (data && data.length > 0) {
        setCategories([allOption, ...data])
      } else {
        setCategories(defaultCategories)
      }
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
      console.error('Supabase not configured')
      // Use sample data for demo
      setArchive([
        {
          id: '1',
          title_en: 'Anfal Campaign Document',
          title_ku: 'بەڵگەنامەی ئەنفال',
          description_en: 'Historical document from the Anfal campaign',
          description_ku: 'بەڵگەنامەیەکی مێژوویی لە کampaینی ئەنفال',
          category_id: 'documents',
          category: 'Documents',
          image_url: '/assets/images/anfal.png',
          file_url: null,
          date_created: new Date().toISOString()
        },
        {
          id: '2',
          title_en: 'Letter from 1960s',
          title_ku: 'نامەیەک لە ساڵانی ١٩٦٠',
          description_en: 'Rare letter from the 1960s era',
          description_ku: 'نامەیەکی دەگمەن لە سەردەمی ساڵانی ١٩٦٠',
          category_id: 'letters',
          category: 'Letters',
          image_url: '/assets/images/awenakan.png',
          file_url: null,
          date_created: new Date().toISOString()
        },
        {
          id: '3',
          title_en: 'Old Photo Collection',
          title_ku: 'کۆمەڵەی وێنە کۆنەکان',
          description_en: 'Collection of rare historical photos',
          description_ku: 'کۆمەڵەیەک لە وێنە مێژووییە دەگمەنەکان',
          category_id: 'photos',
          category: 'Photos',
          image_url: '/assets/images/bg-1.jpg',
          file_url: null,
          date_created: new Date().toISOString()
        }
      ])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('digital_archive')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      setArchive(data || [])
    } catch (error) {
      console.error('Error fetching archive:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get category by ID
  const getCategoryById = (categoryId) => {
    return categories.find(c => c.id === categoryId)
  }

  // Get the effective category ID from an item (handles both old and new format)
  const getItemCategoryId = (item) => {
    // First check new category_id field
    if (item.category_id) {
      return item.category_id
    }
    // Fallback to old category field
    if (item.category) {
      const slug = categoryStringToSlug[item.category] || item.category.toLowerCase()
      const cat = categories.find(c => c.slug === slug)
      if (cat) return cat.id
    }
    return null
  }

  // Filter archive items
  const filteredItems = archive.filter(item => {
    const itemCategoryId = getItemCategoryId(item)
    const matchesCategory = selectedCategory === 'all' || itemCategoryId === selectedCategory
    const matchesSearch = searchQuery === '' || 
      (item.title_en?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.title_ku?.includes(searchQuery)) ||
      (item.description_en?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description_ku?.includes(searchQuery))
    return matchesCategory && matchesSearch
  })

  // Get category display name in English
  const getCategoryName = (item) => {
    const itemCategoryId = getItemCategoryId(item)
    if (itemCategoryId) {
      const cat = getCategoryById(itemCategoryId)
      if (cat) return cat.name_en
    }
    // Fallback to old category field
    if (item.category) {
      const slug = categoryStringToSlug[item.category] || item.category.toLowerCase()
      const cat = categories.find(c => c.slug === slug)
      if (cat) return cat.name_en
      return item.category
    }
    return 'All'
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="relative py-20 bg-gradient-to-b from-red-900 to-gray-900">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Digital Archive
          </h1>
          <p className="text-xl text-gray-300">
            Amna Suraka National Museum
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-4 py-3 pl-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
            />
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {cat.name_en}
              </button>
            ))}
          </div>
        </div>

        {/* Archive Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Link 
                key={item.id} 
                href={`/archive/${item.id}`}
                className="block bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer group"
              >
                {/* Image */}
                <div className="relative aspect-square">
                  <img
                    src={normalizePath(item.image_url)}
                    alt={item.title_en || item.title_ku || 'Archive item'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/assets/images/bg-1.jpg'
                    }}
                  />
                  {/* Category Badge */}
                  <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                    {getCategoryName(item)}
                  </span>
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-lg">
                      View
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2 truncate">
                    {item.title_en || item.title_ku}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-2">
                    {item.description_en || item.description_ku}
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    {formatDate(item.date_created)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-xl">
              No archive items found
            </p>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxItem && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxItem(null)}
        >
          <div 
            className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setLightboxItem(null)}
              className="absolute top-4 right-4 text-white hover:text-red-500 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <div className="relative">
              <img
                src={normalizePath(lightboxItem.image_url)}
                alt={lightboxItem.title_en || lightboxItem.title_ku}
                className="w-full max-h-[60vh] object-contain"
                onError={(e) => {
                  e.target.src = '/assets/images/bg-1.jpg'
                }}
              />
            </div>

            {/* Details */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-red-600 text-white text-sm px-3 py-1 rounded">
                  {getCategoryName(lightboxItem)}
                </span>
                <span className="text-gray-400 text-sm">
                  {formatDate(lightboxItem.date_created)}
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-4">
                {lightboxItem.title_en || lightboxItem.title_ku}
              </h2>

              <p className="text-gray-300 mb-4">
                {lightboxItem.description_en || lightboxItem.description_ku}
              </p>

              {/* Download Button */}
              {lightboxItem.file_url && (
                <a
                  href={normalizePath(lightboxItem.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Back to Home */}
      <div className="text-center py-8">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  )
}
