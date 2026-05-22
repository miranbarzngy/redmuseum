'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase-client'
import { useMuseumName } from '../../lib/useMuseumName'

const defaultCategories = [
  { id: 'all',       name_en: 'All',       name_ku: 'هەموو',         slug: 'all'       },
  { id: 'documents', name_en: 'Documents', name_ku: 'بەڵگەنامەکان', slug: 'documents' },
  { id: 'letters',   name_en: 'Letters',   name_ku: 'نامەکان',       slug: 'letters'   },
  { id: 'photos',    name_en: 'Photos',    name_ku: 'وێنە کۆنەکان', slug: 'photos'    },
]

const categoryStringToSlug = { Documents: 'documents', Letters: 'letters', Photos: 'photos' }

const normalizePath = (path) => {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return path.startsWith('/') ? path : `/${path}`
}

const KU = { fontFamily: 'UniSalar, Tahoma, sans-serif' }

export default function KurdishArchive() {
  const [categories, setCategories] = useState([])
  const [archive, setArchive]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const museumName = useMuseumName()

  useEffect(() => { fetchCategories() }, [])
  useEffect(() => { fetchArchive() }, [])

  const fetchCategories = async () => {
    if (!supabase) { setCategories(defaultCategories); return }
    try {
      const { data, error } = await supabase.from('archive_categories').select('*').order('display_order', { ascending: true })
      if (error) throw error
      const allOption = { id: 'all', name_en: 'All', name_ku: 'هەموو', slug: 'all' }
      setCategories(data?.length ? [allOption, ...data] : defaultCategories)
    } catch { setCategories(defaultCategories) }
  }

  const fetchArchive = async () => {
    if (!supabase) { setLoading(false); return }
    try {
      const { data, error } = await supabase
        .from('digital_archive').select('*').eq('is_active', true).order('display_order', { ascending: true })
      if (error) throw error
      setArchive(data || [])
    } catch {}
    finally { setLoading(false) }
  }

  const getItemCategoryId = (item) => {
    if (item.category_id) return item.category_id
    if (item.category) {
      const slug = categoryStringToSlug[item.category] || item.category.toLowerCase()
      const cat = categories.find(c => c.slug === slug)
      if (cat) return cat.id
    }
    return null
  }

  const getCategoryName = (item) => {
    const id = getItemCategoryId(item)
    if (id) {
      const cat = categories.find(c => c.id === id)
      if (cat && cat.id !== 'all') return cat.name_ku
    }
    if (item.category) {
      const slug = categoryStringToSlug[item.category] || item.category.toLowerCase()
      const cat = categories.find(c => c.slug === slug)
      if (cat) return cat.name_ku
      return item.category
    }
    return ''
  }

  const filteredItems = archive.filter(item => {
    const itemCategoryId = getItemCategoryId(item)
    const matchesCategory = selectedCategory === 'all' || itemCategoryId === selectedCategory
    const q = searchQuery.toLowerCase()
    const matchesSearch = !searchQuery ||
      item.title_en?.toLowerCase().includes(q) ||
      item.title_ku?.includes(searchQuery) ||
      item.description_en?.toLowerCase().includes(q) ||
      item.description_ku?.includes(searchQuery)
    return matchesCategory && matchesSearch
  })

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="w-12 h-12 border-2 border-[#c8a96e] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }} dir="rtl">

      {/* Hero header */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #2a0000 0%, #0a0a0a 100%)' }}>
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(200,169,110,0.15) 0%, transparent 60%), radial-gradient(circle at 70% 50%, rgba(122,0,0,0.3) 0%, transparent 60%)' }} />

        {/* Gold top line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, #c8a96e, transparent)' }} />

        <div className="relative px-4 md:px-8 lg:px-16 py-20 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ background: 'rgba(122,0,0,0.3)', border: '1px solid rgba(200,169,110,0.3)' }}>
            <i className="ri-archive-line text-3xl" style={{ color: '#c8a96e' }} />
          </div>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="block w-16 h-1 rounded-full" style={{ background: 'linear-gradient(to right, transparent, #cc0000)' }} />
            <h1 className="text-4xl md:text-5xl font-black text-white" style={KU}>ئەرشیفی دیجیتاڵی</h1>
            <span className="block w-16 h-1 rounded-full" style={{ background: 'linear-gradient(to left, transparent, #cc0000)' }} />
          </div>
          <p className="text-white/60 text-lg" style={KU}>{museumName.kr}</p>

          {/* Stats strip */}
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(200,169,110,0.15)', color: 'rgba(255,255,255,0.5)', ...KU }}>
            <i className="ri-file-list-3-line text-[#c8a96e]" />
            {archive.length} ئەرشیف
          </div>
        </div>

        {/* Gold bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(200,169,110,0.3), transparent)' }} />
      </div>

      <div className="px-4 md:px-8 lg:px-16 py-10">

        {/* Search + filter row */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-10">

          {/* Search */}
          <div className="relative w-full md:max-w-sm">
            <i className="ri-search-line absolute right-4 top-1/2 -translate-y-1/2 text-[#c8a96e]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="گەڕان... (Search)"
              className="w-full pr-11 pl-4 py-3 text-sm text-white placeholder-white/30 rounded-2xl focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(200,169,110,0.2)', ...KU }}
              onFocus={e => e.target.style.borderColor = 'rgba(200,169,110,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(200,169,110,0.2)'}
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            {categories.map(cat => {
              const isActive = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                  style={{
                    ...KU,
                    background: isActive ? '#7a0000' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isActive ? 'rgba(200,169,110,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: '#fff',
                    boxShadow: isActive ? '0 4px 16px rgba(122,0,0,0.4)' : 'none',
                  }}
                >
                  {cat.name_ku}
                </button>
              )
            })}
          </div>
        </div>

        {/* Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map(item => (
              <Link
                key={item.id}
                href={`/kurdish/archive/${item.id}`}
                className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(200,169,110,0.12)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,169,110,0.35)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(122,0,0,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(200,169,110,0.12)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)' }}
              >
                {/* Gold top accent */}
                <div className="absolute top-0 left-0 right-0 h-px z-10"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(200,169,110,0.4), transparent)' }} />

                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-[#0d0d0d]">
                  <img
                    src={normalizePath(item.image_url)}
                    alt={item.title_ku || item.title_en || ''}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={e => { e.target.src = '/assets/images/bg-1.jpg' }}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'rgba(10,10,10,0.7)' }}>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white"
                      style={{ background: '#7a0000', border: '1px solid rgba(200,169,110,0.4)', ...KU }}>
                      <i className="ri-eye-line text-[#c8a96e]" />
                      بینین
                    </div>
                  </div>
                  {/* Category badge */}
                  {getCategoryName(item) && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-white z-10"
                      style={{ background: '#7a0000', border: '1px solid rgba(200,169,110,0.3)', ...KU }}>
                      {getCategoryName(item)}
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 flex flex-col gap-1.5 flex-1">
                  <h3 className="text-base font-bold text-white leading-snug line-clamp-2" style={KU}>
                    {item.title_ku || item.title_en}
                  </h3>
                  {(item.description_ku || item.description_en) && (
                    <p className="text-xs text-white line-clamp-2 leading-relaxed" style={KU}>
                      {item.description_ku || item.description_en}
                    </p>
                  )}
                  {/* Arrow */}
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: 'rgba(200,169,110,0.5)', ...KU }}>بینینی زیاتر</span>
                    <i className="ri-arrow-left-line text-[#c8a96e] text-sm transition-transform duration-200 group-hover:-translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(122,0,0,0.15)', border: '1px solid rgba(200,169,110,0.15)' }}>
              <i className="ri-file-search-line text-3xl" style={{ color: '#c8a96e' }} />
            </div>
            <p className="text-white/50 text-lg mb-1" style={KU}>هیچ ئەرشیفێک نەدۆزرایەوە</p>
            <p className="text-white/25 text-sm">No archive items found</p>
          </div>
        )}

        {/* Back to home */}
        <div className="flex justify-center mt-14">
          <Link href="/kurdish"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', ...KU }}>
            <i className="ri-arrow-right-line text-[#c8a96e]" />
            گەڕانەوە بۆ سەرەتا
          </Link>
        </div>

      </div>

      {/* Fixed home button */}
      <Link href="/kurdish"
        className="fixed bottom-6 left-6 z-40 w-12 h-12 flex items-center justify-center rounded-full text-white transition-all shadow-lg"
        style={{ background: '#7a0000', border: '1px solid rgba(200,169,110,0.4)', boxShadow: '0 4px 20px rgba(122,0,0,0.5)' }}
        title="گەڕانەوە بۆ سەرەتا">
        <i className="ri-home-5-line text-lg" />
      </Link>

    </div>
  )
}
