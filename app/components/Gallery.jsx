'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase-client'

const categoryNames = {
  visitor: { en: 'Visitor Touring', kr: 'سەیرانی میوان' },
  activity: { en: 'Activities', kr: 'چالاکییەکان' },
  delegation: { en: 'Official Delegations', kr: 'وەفدی فەرمی' },
  donation: { en: 'Donations', kr: 'بەخشین' },
}

// Helper function to normalize paths
const normalizePath = (path) => {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/')) return path
  return `/${path}`
}

export default function Gallery({ currentLang = 'en' }) {
  const isKurdish = currentLang === 'ku'
  const [galleries, setGalleries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchGallery()
  }, [])

  const fetchGallery = async () => {
    if (!supabase) {
      console.log('Supabase not configured')
      setGalleries([])
      setLoading(false)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('gallery')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (fetchError) throw fetchError

      if (data && data.length > 0) {
        const grouped = {}
        data.forEach(img => {
          const category = img.category || 'visitor'
          if (!grouped[category]) {
            grouped[category] = []
          }
          const normalizedUrl = normalizePath(img.image_url)
          grouped[category].push({
            id: img.id,
            image_url: normalizedUrl,
            title: img.title || '',
            description: img.description || ''
          })
        })

        const galleryArray = Object.keys(grouped).map(category => ({
          category,
          images: grouped[category]
        }))

        console.log('Loaded galleries from Supabase:', galleryArray.length, 'categories')
        setGalleries(galleryArray)
      } else {
        console.log('No gallery data in database')
        setGalleries([])
      }
    } catch (err) {
      console.log('Error fetching gallery:', err.message)
      setError(err.message)
      setGalleries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel('gallery-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gallery' },
        (payload) => {
          console.log('Gallery change detected:', payload)
          fetchGallery()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <section id="gallery" className="py-20 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </section>
    )
  }

  if (galleries.length === 0 || galleries.every(g => g.images.length === 0)) {
    return (
      <section id="gallery" className="py-20 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            {isKurdish ? 'گەلەری' : 'Gallery'}
          </h2>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {isKurdish ? 'هیچ وێنەیەک لە گەلەریدا نییە.' : 'No images found in the gallery.'}
            </p>
          </div>
        </div>
      </section>
    )
  }

  // Get animation direction based on category
  const getScrollAnimation = (category) => {
    // Visitor and Activity: Right to Left (scroll-left)
    // Delegation and Donation: Left to Right (scroll-right)
    if (category === 'delegation' || category === 'donation') {
      return 'scroll-right'
    }
    return 'scroll-left'
  }

  // Render scroll track with images
  const renderScrollTrack = (gallery) => {
    const animation = getScrollAnimation(gallery.category)
    
    return (
      <div className="w-full overflow-hidden" dir="ltr">
        <div 
          className="scroll-track"
          style={{
            animation: `${animation} ${gallery.images.length * 5}s linear infinite`,
          }}
          onMouseEnter={(e) => e.currentTarget.style.animationPlayState = 'paused'}
          onMouseLeave={(e) => e.currentTarget.style.animationPlayState = 'running'}
        >
          {/* First set */}
          {gallery.images.map((img, imgIndex) => (
            <div key={`first-${img.id || imgIndex}`} className="flex-shrink-0 w-64 h-48">
              <img
                src={img.image_url}
                alt={img.title || `${gallery.category} ${imgIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {gallery.images.map((img, imgIndex) => (
            <div key={`second-${img.id || imgIndex}`} className="flex-shrink-0 w-64 h-48">
              <img
                src={img.image_url}
                alt={img.title || `${gallery.category} ${imgIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section id="gallery" className="py-20 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          {isKurdish ? 'گەلەری' : 'Gallery'}
        </h2>

        {galleries.map((gallery) => (
          gallery.images.length > 0 && (
            <div key={gallery.category} className="mb-16">
              <h3 className="text-2xl font-semibold mb-6 text-gray-700 text-center">
                {categoryNames[gallery.category]?.[isKurdish ? 'kr' : 'en'] || gallery.category}
              </h3>
              {renderScrollTrack(gallery)}
            </div>
          )
        ))}
      </div>
    </section>
  )
}
