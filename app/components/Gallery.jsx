'use client'

import { useState, useEffect } from 'react'
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
  // If already a full URL (http/https), don't modify
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  // If already has leading slash, return as is
  if (path.startsWith('/')) return path
  // Otherwise add leading slash for relative paths
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
    // Skip if supabase is not configured
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
        // Group images by category dynamically
        const grouped = {}
        data.forEach(img => {
          const category = img.category || 'visitor'
          if (!grouped[category]) {
            grouped[category] = []
          }
          
          // Normalize the image URL
          const normalizedUrl = normalizePath(img.image_url)
          
          grouped[category].push({
            id: img.id,
            image_url: normalizedUrl,
            title: img.title || '',
            description: img.description || ''
          })
        })

        // Convert to array format with category info
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

  // Subscribe to realtime changes for gallery table
  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel('gallery-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gallery'
        },
        (payload) => {
          console.log('Gallery change detected:', payload)
          // Refresh gallery when any change happens
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

  // Empty state - no images in database
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
            <p className="text-gray-400 mt-2">
              {isKurdish ? 'تکایە وێنە زیاد بکە لە پەیجی بەڕێوەبردن.' : 'Please add images from the admin panel.'}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="gallery" className="py-20 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          {isKurdish ? 'گەلەری' : 'Gallery'}
        </h2>

        {galleries.map((gallery, galleryIndex) => (
          // Only render categories that have images
          gallery.images.length > 0 && (
            <div key={gallery.category} className="mb-16">
              <h3 className="text-2xl font-semibold mb-6 text-gray-700">
                {categoryNames[gallery.category]?.[isKurdish ? 'kr' : 'en'] || gallery.category}
              </h3>
              
              {gallery.category === 'visitor' ? (
                /* Right-to-left infinite scroll animation for Visitor Touring */
                <div className="w-full overflow-hidden">
                  <div 
                    className="scroll-track"
                    style={{
                      animation: `scroll-left ${gallery.images.length * 5}s linear infinite`,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.animationPlayState = 'paused'}
                    onMouseLeave={(e) => e.currentTarget.style.animationPlayState = 'running'}
                  >
                    {/* First set of images */}
                    {gallery.images.map((img, imgIndex) => (
                      <div key={`first-${img.id || imgIndex}`} className="flex-shrink-0 w-64 h-48">
                        <img
                          src={img.image_url}
                          alt={img.title || `Visitor ${imgIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {/* Duplicate set for seamless loop */}
                    {gallery.images.map((img, imgIndex) => (
                      <div key={`second-${img.id || imgIndex}`} className="flex-shrink-0 w-64 h-48">
                        <img
                          src={img.image_url}
                          alt={img.title || `Visitor ${imgIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : gallery.category === 'activity' || gallery.category === 'delegation' || gallery.category === 'donation' ? (
                /* Infinite scroll animation for other categories */
                <div className="w-full overflow-hidden">
                  <div 
                    className="scroll-track"
                    style={{
                      animation: `${gallery.category === 'activity' ? 'scroll-left' : 'scroll-right'} ${gallery.images.length * 5}s linear infinite`,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.animationPlayState = 'paused'}
                    onMouseLeave={(e) => e.currentTarget.style.animationPlayState = 'running'}
                  >
                    {/* First set of images */}
                    {gallery.images.map((img, imgIndex) => (
                      <div key={`first-${img.id || imgIndex}`} className="flex-shrink-0 w-64 h-48 relative group overflow-hidden rounded-lg">
                        <img
                          src={img.image_url}
                          alt={img.title || `${gallery.category} ${imgIndex + 1}`}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                        />
                        {/* Hover overlay with title */}
                        {img.title && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                            <div className="p-2 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white text-sm font-medium truncate bg-black/50 px-2 py-1 rounded">
                                {img.title}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Duplicate set for seamless loop */}
                    {gallery.images.map((img, imgIndex) => (
                      <div key={`second-${img.id || imgIndex}`} className="flex-shrink-0 w-64 h-48 relative group overflow-hidden rounded-lg">
                        <img
                          src={img.image_url}
                          alt={img.title || `${gallery.category} ${imgIndex + 1}`}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                        />
                        {/* Hover overlay with title */}
                        {img.title && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                            <div className="p-2 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white text-sm font-medium truncate bg-black/50 px-2 py-1 rounded">
                                {img.title}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Default scrollable gallery for other categories */
                <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                  {gallery.images.map((img, imgIndex) => (
                    <div key={img.id || imgIndex} className="flex-shrink-0 w-64 h-48 relative group overflow-hidden rounded-lg">
                      <img
                        src={img.image_url}
                        alt={img.title || `${gallery.category} ${imgIndex + 1}`}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                      />
                      {/* Hover overlay with title and description */}
                      {(img.title || img.description) && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-end">
                          <div className="p-3 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                            {img.title && (
                              <p className="text-white font-medium truncate">
                                {img.title}
                              </p>
                            )}
                            {img.description && (
                              <p className="text-gray-300 text-sm truncate">
                                {img.description}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        ))}
      </div>
    </section>
  )
}
