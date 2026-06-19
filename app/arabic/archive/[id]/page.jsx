'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase-client'
import Link from 'next/link'

const defaultCategories = [
  { id: 'documents', name_en: 'Documents', name_ar: 'المستندات',    slug: 'documents' },
  { id: 'letters',   name_en: 'Letters',   name_ar: 'الرسائل',      slug: 'letters'   },
  { id: 'photos',    name_en: 'Photos',    name_ar: 'الصور القديمة', slug: 'photos'    },
]

const categoryStringToSlug = { Documents: 'documents', Letters: 'letters', Photos: 'photos' }

const normalizePath = (path) => {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return path.startsWith('/') ? path : `/${path}`
}

const KU = { fontFamily: 'UniSalar, Tahoma, sans-serif' }
const AR = { fontFamily: 'Cairo, Tahoma, sans-serif' }

export default function ArabicArchiveDetail() {
  const params = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])
  const [activeLang, setActiveLang] = useState('ar')

  useEffect(() => { fetchCategories() }, [])
  useEffect(() => { if (params?.id) fetchItem(params.id) }, [params?.id])
  useEffect(() => { if (item) document.title = getTitle(item) || 'Archive Item' }, [item])

  // Set default lang to first available when item loads
  useEffect(() => {
    if (!item) return
    if (item.description_ar?.trim()) setActiveLang('ar')
    else if (item.description_ku?.trim()) setActiveLang('ku')
    else if (item.description_en?.trim()) setActiveLang('en')
  }, [item])

  const fetchCategories = async () => {
    if (!supabase) { setCategories(defaultCategories); return }
    try {
      const { data, error } = await supabase.from('archive_categories').select('*').order('display_order', { ascending: true })
      if (error) throw error
      setCategories(data || defaultCategories)
    } catch { setCategories(defaultCategories) }
  }

  const fetchItem = async (id) => {
    setLoading(true); setError(null)
    if (!supabase) { setError('Supabase not configured'); setLoading(false); return }
    try {
      const { data, error } = await supabase.from('digital_archive').select('*').eq('id', id).single()
      if (error) throw error
      setItem(data)
    } catch { setError('Archive item not found') }
    finally { setLoading(false) }
  }

  const getItemCategoryId = (item) => {
    if (item?.category_id) return item.category_id
    if (item?.category) {
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

  const getTitle = (item) => item?.title_ar || item?.title_ku || item?.title_en || ''

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="w-12 h-12 border-2 border-[#c8a96e] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !item) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }} dir="rtl">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(122,0,0,0.2)', border: '1px solid rgba(200,169,110,0.2)' }}>
          <i className="ri-file-search-line text-3xl" style={{ color: '#c8a96e' }} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2" style={AR}>الأرشيف غير موجود</h1>
        <p className="text-gray-500 mb-8 text-sm">Archive item not found</p>
        <Link href="/arabic/archive"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold text-sm"
          style={{ background: '#7a0000', border: '1px solid rgba(200,169,110,0.3)', ...AR }}>
          <i className="ri-arrow-right-line" />
          العودة إلى الأرشيف
        </Link>
      </div>
    </div>
  )

  // Build available language tabs — only include if content is non-empty
  const langTabs = [
    item.description_ar?.trim() && { key: 'ar', label: 'عربي',    font: AR,  dir: 'rtl', text: item.description_ar },
    item.description_ku?.trim() && { key: 'ku', label: 'کوردی',   font: KU,  dir: 'rtl', text: item.description_ku },
    item.description_en?.trim() && { key: 'en', label: 'English', font: {},   dir: 'ltr', text: item.description_en },
  ].filter(Boolean)

  const activeLangData = langTabs.find(t => t.key === activeLang) || langTabs[0]

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }} dir="rtl">

      {/* Sticky top nav */}
      <div className="sticky top-0 z-30 px-4 md:px-8 lg:px-16 py-4 flex items-center justify-between"
        style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(200,169,110,0.1)' }}>
        <Link href="/arabic/archive"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', ...AR }}>
          <i className="ri-arrow-right-line text-[#c8a96e]" />
          العودة إلى الأرشيف
        </Link>
        <div className="flex items-center gap-2 text-white text-xs" style={AR}>
          <span>الأرشيف</span>
          <i className="ri-arrow-left-s-line" />
          <span className="truncate max-w-[200px]">{getTitle(item)}</span>
        </div>
      </div>

      <div className="px-4 md:px-8 lg:px-16 py-12">
        <div className="max-w-4xl mx-auto">

          {/* Title header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, rgba(200,169,110,0.4), transparent)' }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#c8a96e' }} />
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(200,169,110,0.4), transparent)' }} />
            </div>

            <div className="flex items-center gap-3 flex-wrap mb-4">
              {getCategoryName(item) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                  style={{ background: '#7a0000', border: '1px solid rgba(200,169,110,0.3)', ...AR }}>
                  <i className="ri-archive-line text-[#c8a96e] text-[10px]" />
                  {getCategoryName(item)}
                </span>
              )}
              {item.date_created && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', ...AR }}>
                  <i className="ri-calendar-line text-[#c8a96e] text-[10px]" />
                  {formatDate(item.date_created)}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white leading-snug" style={AR}>
              {getTitle(item)}
            </h1>
          </div>

          {/* Image card */}
          <div className="rounded-2xl overflow-hidden mb-8 relative"
            style={{
              border: '1px solid rgba(200,169,110,0.2)',
              boxShadow: '0 0 0 1px rgba(200,169,110,0.06), 0 32px 80px rgba(0,0,0,0.7)',
              background: '#0d0d0d',
            }}>
            <div className="absolute top-0 left-0 right-0 h-px z-10"
              style={{ background: 'linear-gradient(to right, transparent, #c8a96e, transparent)' }} />
            <div className="relative w-full flex items-center justify-center p-6 md:p-10"
              style={{ minHeight: 320 }}>
              <img
                src={normalizePath(item.image_url)}
                alt={getTitle(item)}
                className="max-w-full max-h-[560px] object-contain rounded-xl"
                style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
                onError={e => { e.target.src = '/assets/images/bg-1.jpg' }}
              />
            </div>
          </div>

          {/* Language-switching info card */}
          {langTabs.length > 0 && (
            <div className="rounded-2xl overflow-hidden mb-8 relative"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(200,169,110,0.15)',
                boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
              }}>
              {/* Gold top accent */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(to right, transparent, #c8a96e, transparent)' }} />

              {/* Language tab bar */}
              <div className="flex items-stretch border-b" style={{ borderColor: 'rgba(200,169,110,0.12)' }}>
                {langTabs.map((tab, i) => {
                  const isActive = activeLang === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveLang(tab.key)}
                      className="relative flex-1 flex items-center justify-center gap-2 py-4 px-4 text-sm font-bold transition-all duration-200"
                      style={{
                        ...tab.font,
                        color: '#fff',
                        background: isActive ? 'rgba(122,0,0,0.25)' : 'transparent',
                        borderLeft: i > 0 ? '1px solid rgba(200,169,110,0.1)' : 'none',
                      }}
                    >
                      {isActive && (
                        <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
                          style={{ background: '#c8a96e' }} />
                      )}
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: isActive ? '#c8a96e' : 'rgba(255,255,255,0.2)' }} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Description content */}
              {activeLangData && (
                <div className="p-6 md:p-10" dir={activeLangData.dir}>
                  <p
                    className="text-base md:text-lg leading-loose text-white whitespace-pre-wrap"
                    style={{ ...activeLangData.font, minHeight: 80 }}
                  >
                    {activeLangData.text}
                  </p>
                </div>
              )}

              {/* Download PDF */}
              {item.file_url && (
                <div className="px-6 md:px-10 pb-6 pt-0">
                  <div className="h-px mb-6" style={{ background: 'rgba(200,169,110,0.1)' }} />
                  <a
                    href={normalizePath(item.file_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white"
                    style={{ background: '#7a0000', border: '1px solid rgba(200,169,110,0.3)', ...AR }}>
                    <i className="ri-download-2-line" />
                    تحميل / Download PDF
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Bottom back button */}
          <div className="flex justify-center">
            <Link href="/arabic/archive"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl text-sm font-semibold text-white"
              style={{ background: '#7a0000', border: '1px solid rgba(200,169,110,0.3)', boxShadow: '0 4px 20px rgba(122,0,0,0.3)', ...AR }}>
              <i className="ri-arrow-right-line" />
              عرض جميع الأرشيف
            </Link>
          </div>

        </div>
      </div>

    </div>
  )
}
