'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase-client'

const categoryNames = {
  visitor: { en: 'Visitor Touring', kr: 'سەیرانی میوان' },
  activity: { en: 'Activities', kr: 'چالاکییەکان' },
  delegation: { en: 'Official Delegations', kr: 'وەفدی فەرمی' },
  donation: { en: 'Donations', kr: 'بەخشین' },
}

const fallbackGalleries = [
  {
    category: 'visitor',
    images: [
      '/assets/images/Vistor Touring/1.jpg',
      '/assets/images/Vistor Touring/2.jpg',
      '/assets/images/Vistor Touring/3.jpg',
      '/assets/images/Vistor Touring/4.jpg',
      '/assets/images/Vistor Touring/5.jpg',
      '/assets/images/Vistor Touring/6.jpg',
      '/assets/images/Vistor Touring/7.jpg',
      '/assets/images/Vistor Touring/8.jpg',
      '/assets/images/Vistor Touring/9.jpg',
    ]
  },
  {
    category: 'activity',
    images: [
      '/assets/images/Activity/1.jpg',
      '/assets/images/Activity/2.jpg',
      '/assets/images/Activity/3.jpg',
      '/assets/images/Activity/4.jpg',
      '/assets/images/Activity/5.jpg',
      '/assets/images/Activity/6.jpg',
      '/assets/images/Activity/7.jpg',
      '/assets/images/Activity/8.jpg',
      '/assets/images/Activity/9.jpg',
    ]
  },
  {
    category: 'delegation',
    images: [
      '/assets/images/official delegation visit/1.jpg',
      '/assets/images/official delegation visit/2.jpg',
      '/assets/images/official delegation visit/3.jpg',
      '/assets/images/official delegation visit/4.jpg',
      '/assets/images/official delegation visit/5.jpg',
      '/assets/images/official delegation visit/6.jpg',
      '/assets/images/official delegation visit/7.jpg',
      '/assets/images/official delegation visit/8.jpg',
      '/assets/images/official delegation visit/9.jpg',
    ]
  },
  {
    category: 'donation',
    images: [
      '/assets/images/donation/1.jpg',
      '/assets/images/donation/2.jpg',
      '/assets/images/donation/3.jpg',
      '/assets/images/donation/4.jpg',
      '/assets/images/donation/5.jpg',
      '/assets/images/donation/6.png',
      '/assets/images/donation/7.jpg',
      '/assets/images/donation/8.jpeg',
    ]
  }
]

export default function Gallery({ currentLang = 'en' }) {
  const isKurdish = currentLang === 'ku'
  const [galleries, setGalleries] = useState(fallbackGalleries)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGallery()
  }, [])

  const fetchGallery = async () => {
    // Skip if supabase is not configured
    if (!supabase) {
      console.log('Supabase not configured, using fallback galleries')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        // Group images by category
        const grouped = {}
        data.forEach(img => {
          if (!grouped[img.category]) {
            grouped[img.category] = []
          }
          grouped[img.category].push(img.image_url)
        })

        // Convert to array format
        const galleryArray = Object.keys(grouped).map(category => ({
          category,
          images: grouped[category]
        }))

        console.log('Loaded galleries from Supabase:', galleryArray.length)
        setGalleries(galleryArray)
      } else {
        console.log('No gallery data, using fallback')
      }
    } catch (error) {
      console.log('Error fetching gallery:', error.message)
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <section id="gallery" className="py-20 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          {isKurdish ? 'گەلەری' : 'Gallery'}
        </h2>

          {galleries.map((gallery, galleryIndex) => (
          <div key={galleryIndex} className="mb-16">
            <h3 className="text-2xl font-semibold mb-6 text-gray-700">
              {categoryNames[gallery.category]?.[isKurdish ? 'kr' : 'en'] || gallery.category}
            </h3>
            {gallery.category === 'visitor' ? (
              /* Right-to-left infinite scroll animation for Visitor Touring - Single Row */
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
                    <div key={`first-${imgIndex}`} className="flex-shrink-0 w-64 h-48">
                      <img
                        src={img}
                        alt={`Visitor ${imgIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {/* Duplicate set for seamless loop */}
                  {gallery.images.map((img, imgIndex) => (
                    <div key={`second-${imgIndex}`} className="flex-shrink-0 w-64 h-48">
                      <img
                        src={img}
                        alt={`Visitor ${imgIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : gallery.category === 'activity' || gallery.category === 'delegation' || gallery.category === 'donation' ? (
              /* Infinite scroll animation with dynamic speed based on image count */
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
                    <div key={`first-${imgIndex}`} className="flex-shrink-0 w-64 h-48">
                      <img
                        src={img}
                        alt={`${gallery.category} ${imgIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {/* Duplicate set for seamless loop */}
                  {gallery.images.map((img, imgIndex) => (
                    <div key={`second-${imgIndex}`} className="flex-shrink-0 w-64 h-48">
                      <img
                        src={img}
                        alt={`${gallery.category} ${imgIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Default scrollable gallery for other categories */
              <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                {gallery.images.map((img, imgIndex) => (
                  <div key={imgIndex} className="flex-shrink-0 w-64 h-48 relative group overflow-hidden rounded-lg">
                    <img
                      src={img}
                      alt={`${gallery.category} ${imgIndex + 1}`}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const fallbackImg = fallbackGalleries.find(f => f.category === gallery.category)?.images[imgIndex]
                        if (fallbackImg && e.target.src !== fallbackImg) {
                          e.target.src = fallbackImg
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
