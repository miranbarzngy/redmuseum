'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase-client'

const SLIDE_DURATION = 8500

// Helper function to normalize paths - handles relative paths, absolute URLs, and already-prefixed paths
const normalizePath = (path) => {
  if (!path) return null
  // If already a full URL (http/https), don't modify
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  // If already has leading slash, return as is
  if (path.startsWith('/')) return path
  // Otherwise add leading slash for relative paths
  return `/${path}`
}

const fallbackSlides = [
  { slide_number: 1, title: 'Red Prison', title_kr: 'ئەمنە سورەکە', title_ar: 'السجن الأحمر', subtitle: 'museum', subtitle_kr: 'مۆزەی', subtitle_ar: 'متحف', description: 'Statue of dictator Saddam Hussein', description_kr: 'پەیکەری دیکتاتۆر سەدام حوسێن', description_ar: 'تمثال الدكتاتور صدام حسين', background_image: '/assets/images/bg-1.jpg', museum_image: '/assets/images/saddam2.png', video_url: '/assets/videos/peshmarga.mp4' },
  { slide_number: 2, title: 'Peshmarga', title_kr: 'پێشمەرگە', title_ar: 'البيشمركة', subtitle: 'museum', subtitle_kr: 'مۆزەی', subtitle_ar: 'متحف', description: 'Peshmerga is an ambassador of generosity and love', description_kr: 'پێشمەرگە باڵویزی بەخشندەی و خۆشەویستی', description_ar: 'البيشمركة سفير الكرم والحب', background_image: '/assets/images/bg-2.jpg', museum_image: '/assets/images/peshmarga.png', video_url: '/assets/videos/peshmarga.mp4' },
  { slide_number: 3, title: 'Cinema', title_kr: 'سینەما', title_ar: 'السينما', subtitle: 'museum', subtitle_kr: 'مۆزەی', subtitle_ar: 'متحف', description: '', description_kr: 'سینەمای یەڵماز گونەی', description_ar: 'سينما يلماز غوناي', background_image: '/assets/images/bg-3.jpg', museum_image: '/assets/images/cinema.png', video_url: '/assets/videos/cinema.mp4' },
  { slide_number: 4, title: 'Kurdish Heritage', title_kr: 'کلتور', title_ar: 'التراث الكردي', subtitle: 'museum', subtitle_kr: 'مۆزەی', subtitle_ar: 'متحف', description: 'cultural and heritage museum', description_kr: 'شێخ مەحمود یەکەم مەلیکی کوردوستان', description_ar: 'متحف التراث والثقافة', background_image: '/assets/images/bg-4.jpg', museum_image: '/assets/images/malikshekhmahmud.png', video_url: '/assets/videos/Malikshexmahmud.mp4' },
  { slide_number: 5, title: 'Prisons', title_kr: 'زیندانیان', title_ar: 'السجون', subtitle: 'museum', subtitle_kr: 'مۆزەی', subtitle_ar: 'متحف', description: 'These jails remained intact', description_kr: 'ئەم بەشە تایبەت بووە بۆ هەڵواسین', description_ar: 'ظلت هذه السجون سليمة', background_image: '/assets/images/bg-5.jpg', museum_image: '/assets/images/zindanyakan.png', video_url: '/assets/videos/zindanakan.mp4' },
  { slide_number: 6, title: 'Mine Museum', title_kr: 'مین و تەقەمەنی', title_ar: 'متحف الألغام', subtitle: 'museum', subtitle_kr: 'مۆزەی', subtitle_ar: 'متحف', description: 'dedicated to displaying all types of mines', description_kr: 'ئەم بەشە تایبەتە بە پیشاندان', description_ar: 'مخصص لعرض جميع أنواع الألغام', background_image: '/assets/images/bg-6.jpg', museum_image: '/assets/images/minwtaqamany.png', video_url: '/assets/videos/Min-taqmany.mp4' },
  { slide_number: 7, title: 'Exodus', title_kr: 'کۆڕەو', title_ar: 'الخروج', subtitle: 'museum', subtitle_kr: 'مۆزەی', subtitle_ar: 'متحف', description: 'After the 1991 spring uprising', description_kr: 'دوای ڕاپەڕینی بەهاری ١٩٩١', description_ar: 'بعد انتفاضة ربيع 1991', background_image: '/assets/images/bg-koraw.jpg', museum_image: '/assets/images/koraw.png', video_url: '/assets/videos/koraw.mp4' },
  { slide_number: 8, title: 'Mirrors', title_kr: 'ئاوێنەکان', title_ar: 'المرايا', subtitle: 'museum', subtitle_kr: 'مۆزەی', subtitle_ar: 'متحف', description: "It's walls are covered with 182,000 mirrors", description_kr: 'دویوارەکان ڕوپۆشکراووە بە ١٨٢،٠٠٠ پارچە ئاوێنە', description_ar: 'الجدران مغطاة بـ 182000 مرآة', background_image: '/assets/images/bg-awenakan.jpg', museum_image: '/assets/images/awenakan.png', video_url: '/assets/videos/awenakan.mp4' },
  { slide_number: 9, title: 'Martyrs of ISIS', title_kr: 'شەهیدانی打底', title_ar: 'شهداء حرب تنظيم الدولة', subtitle: 'museum', subtitle_kr: 'مۆزەی', subtitle_ar: 'متحف', description: 'In that unwanted war we represented the world', description_kr: 'لەو جەنگە نەخوازراوەدا نوێنەرایەتی جیهانمان کرد', description_ar: 'في تلك الحرب غير المرغوبة مثلنا العالم', background_image: '/assets/images/bg-isis.jpg', museum_image: '/assets/images/isis.png', video_url: '/assets/videos/isis.mp4' },
  { slide_number: 10, title: 'Exhibition Hall', title_kr: 'گەلەری', title_ar: 'قاعة المعرض', subtitle: 'museum', subtitle_kr: 'مۆزەی', subtitle_ar: 'متحف', description: 'Gallery hall for exhibiting works', description_kr: 'هۆڵی گەلەری بۆ نمایشکردنی کاری هونەری', description_ar: 'قاعة المعرض لعرض الأعمال الفنية', background_image: '/assets/images/bg-gallery.jpg', museum_image: '/assets/images/gallaery.png', video_url: '/assets/videos/gallery.mp4' },
  { slide_number: 11, title: 'Anfal', title_kr: 'ئەنفال', title_ar: 'أنفال', subtitle: 'museum', subtitle_kr: 'مۆزەی', subtitle_ar: 'متحف', description: 'dedicated to displaying victims of Anfal', description_kr: 'تایبەتە بە نمایشکردنی ناو و وێنەی قوربانیان', description_ar: 'مخصص لعرض ضحايا أنفال', background_image: '/assets/images/bg-anfal.jpg', museum_image: '/assets/images/anfal.png', video_url: '/assets/videos/anfal.mp4' },
  { slide_number: 12, title: 'Resistance', title_kr: 'خۆڕاگری', title_ar: 'المقاومة', subtitle: 'museum', subtitle_kr: 'مۆزەی', subtitle_ar: 'متحف', description: 'dedicated to political prisoners', description_kr: 'تایبەتە بە ناو وێنەی ئەو زیندانییە سیاسیانە', description_ar: 'مخصص للسجناء السياسيين', background_image: '/assets/images/bg-xoragry.jpg', museum_image: '/assets/images/xoragry.png', video_url: '/assets/videos/balganama.mp4' },
  { slide_number: 13, title: 'Heavy Weapons', title_kr: 'گۆڕەپانی چەکی قورس', title_ar: 'ساحة الأسلحة الثقيلة', subtitle: 'museum', subtitle_kr: 'مۆزەی', subtitle_ar: 'متحف', description: 'dedicated to displaying tanks and military vehicles', description_kr: 'تایبەتە بە نمایشکردنی ئەو تانک و تۆپ', description_ar: 'مخصص لعرض الدبابات والمركبات العسكرية', background_image: '/assets/images/bg-gorapan.jpg', museum_image: '/assets/images/gorapan.png', video_url: '/assets/videos/red museum.mp4' },
]

// Helper function to get localized content with fallback: Arabic → Kurdish → English
const getLocalizedContent = (slide, field, lang) => {
  if (lang === 'ar') {
    // Arabic → Kurdish → English fallback
    return slide[`${field}_ar`] || slide[`${field}_kr`] || slide[field] || ''
  } else if (lang === 'kr') {
    // Kurdish → English fallback
    return slide[`${field}_kr`] || slide[field] || ''
  }
  // Default to English
  return slide[field] || ''
}


export default function Slider({ currentLang = 'en' }) {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [videoModal, setVideoModal] = useState({ open: false, videoUrl: '', title: '' })
  const [playSlider, setPlaySlider] = useState(null)

  const lang = currentLang === 'ku' ? 'kr' : currentLang === 'ar' ? 'ar' : 'en'
  const isKurdish = currentLang === 'ku'
  const isArabic = currentLang === 'ar'

  const fetchSlides = useCallback(async () => {
    // Skip if supabase is not configured
    if (!supabase) {
      console.log('Supabase not configured, using fallback slides')
      setSlides(fallbackSlides)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('slides')
        .select('*')
        .eq('is_active', true)
        .order('slide_number', { ascending: true })

      if (error) {
        console.log('Supabase error:', error.message)
        throw error
      }
      if (data && data.length > 0) {
        console.log('Loaded slides from Supabase:', data.length)
        // Process paths: add leading slash only for relative paths (not absolute URLs)
        const processedSlides = data.map(slide => ({
          ...slide,
          background_image: normalizePath(slide.background_image),
          museum_image: normalizePath(slide.museum_image),
          video_url: normalizePath(slide.video_url),
        }))
        setSlides(processedSlides)
      } else {
        console.log('No slides in database, using fallback')
        setSlides(fallbackSlides)
      }
    } catch (error) {
      console.log('Error fetching slides:', error.message)
      setSlides(fallbackSlides)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch slides on mount
  useEffect(() => {
    fetchSlides()
  }, [fetchSlides])

  // Subscribe to realtime changes for slides table
  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel('slides-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'slides'
        },
        (payload) => {
          console.log('Slide change detected:', payload)
          // Refresh slides when any change happens
          fetchSlides()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchSlides])

  useEffect(() => {
    if (slides.length === 0) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, SLIDE_DURATION)

    setPlaySlider(interval)
    return () => clearInterval(interval)
  }, [slides.length])

  const goToSlide = (index) => {
    setCurrentSlide(index)
    if (playSlider) clearInterval(playSlider)
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, SLIDE_DURATION)
    setPlaySlider(interval)
  }

  const prevSlide = () => {
    goToSlide(currentSlide === 0 ? slides.length - 1 : currentSlide - 1)
  }

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % slides.length)
  }

  const openVideo = (videoUrl, title) => {
    if (playSlider) clearInterval(playSlider)
    setVideoModal({ open: true, videoUrl, title })
  }

  const closeVideo = () => {
    setVideoModal({ open: false, videoUrl: '', title: '' })
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, SLIDE_DURATION)
    setPlaySlider(interval)
  }

  if (loading) {
    return (
      <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-lg font-medium">Loading slides...</p>
        </div>
      </div>
    )
  }

  const currentSlideData = slides[currentSlide]

  return (
    <section id="home" className="relative w-full h-screen overflow-hidden">
      {/* Bottom gradient overlay - more subtle with smoother transition */}
      <div className="absolute bottom-0 left-0 w-full h-[35%] bg-gradient-to-t from-black/60 via-black/20 to-transparent z-[778]"></div>
      
      {/* Main Slide */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.slide_number}
            className={`absolute top-0 left-0 w-full h-screen transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Background Image - absolute top-0 left-0 w-full h-screen object-cover with museum-bg animation */}
            <img
              src={slide.background_image}
              alt=""
              className="absolute top-0 left-0 w-full h-screen object-cover museum-bg-animation"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50"></div>

            {/* Cutout Image (museum_image/Peshmerga) - absolute top-0 left-0 w-full h-screen object-contain with pointer-events-none */}
            {slide.museum_image && (
              <img
                src={slide.museum_image}
                alt=""
                className="absolute top-0 left-0 w-full h-screen object-contain pointer-events-none z-[776] md:translate-y-[75px]"
              />
            )}

            {/* Text Content Layer - z-[777] absolute container flex flex-col items-center justify-center */}
            <div 
              className="absolute top-0 left-0 w-full h-screen flex flex-col items-center justify-center z-[777]"
              dir={isArabic ? 'rtl' : 'ltr'}
            >
              {/* Caption - NOT TO BE FORGOTTEN - styled to match slide titles */}
              <h3 
                className="absolute top-[80px] lg:top-[70px]"
                style={{ 
                  color: '#dc2626', // Red color matching museum theme
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  letterSpacing: isKurdish ? '0' : isArabic ? '0' : '0.2em',
                  textTransform: isKurdish ? 'none' : isArabic ? 'none' : 'uppercase',
                  fontFamily: isKurdish ? 'UniSalar, Tahoma, sans-serif' : isArabic ? 'Cairo, Tahoma, sans-serif' : 'system-ui, sans-serif',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}
              >
                {isKurdish ? 'تا لە یادمان نەچێت' : isArabic ? 'لن ننسى' : 'Not To Be Forgotten'}
              </h3>
              
              {/* Museum Name - position absolute top-[170px] right-[190px] (adjusted for mobile) */}
              <h1 className="museum-name absolute text-white font-bold md:text-6xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] max-[400px]:text-[.9em] max-[400px]:top-[100px] max-[400px]:right-[40px] max-[580px]:text-[1em] max-[580px]:top-[160px] max-[580px]:right-[40px] max-[850px]:text-[1em] max-[850px]:top-[150px] lg:top-[170px] lg:right-[190px] max-[990px]:right-[90px] max-[990px]:top-[170px]"
                  style={{ 
                    textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 4px 8px rgba(0,0,0,0.6)',
                    fontFamily: isArabic ? 'Cairo, Tahoma, sans-serif' : isKurdish ? 'UniSalar, Tahoma, sans-serif' : 'system-ui, sans-serif'
                  }}>
                {getLocalizedContent(slide, 'title', lang)}
                <br />
                <span className="museum-span text-3xl font-light bg-red-600 px-2" dir={isKurdish || isArabic ? 'rtl' : 'ltr'}>
                  {getLocalizedContent(slide, 'subtitle', lang)}
                </span>
              </h1>
              
              {/* Paragraph - enhanced for better readability with higher contrast background */}
              <p 
                className="absolute bottom-16 lg:bottom-20 text-white text-lg md:text-2xl font-semibold max-w-4xl px-6 md:px-16 py-3 md:py-4 rounded-lg max-[580px]:text-base max-[580px]:w-[90%] max-[580px]:text-center leading-relaxed"
                style={{ 
                   textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 4px 8px rgba(0,0,0,0.6)',
                   backgroundColor: 'rgba(0, 0, 0, 0.75)',
                   fontFamily: isKurdish ? 'UniSalar, Tahoma, sans-serif' : isArabic ? 'Cairo, Tahoma, sans-serif' : 'system-ui, sans-serif',
                   lineHeight: isKurdish ? '1.8' : '1.6'
                 }}
                 dir={isArabic ? 'rtl' : 'ltr'}
              >
                {getLocalizedContent(slide, 'description', lang)}
              </p>
            </div>

          </div>
        ))}
      </div>

      {/* Navigation Arrows - styled according to original CSS - always LTR for arrow icons */}
      <div dir="ltr" className="absolute bottom-[30px] right-[100px] flex gap-[70px] z-[888] max-[990px]:bottom-[30px] max-[990px]:right-auto max-[990px]:left-0 max-[990px]:w-full max-[990px]:justify-center max-[990px]:gap-[60px] max-[580px]:bottom-[35px] max-[580px]:right-0 max-[580px]:left-auto max-[580px]:w-1/2 max-[580px]:gap-[40px] max-[400px]:gap-[10px] max-[400px]:bottom-[30px]">
        <button
          onClick={prevSlide}
          className="text-[#bfbfbf] text-[0.8em] font-semibold flex items-center justify-center cursor-pointer select-none transition-colors duration-300 hover:text-[#ff0000]"
          aria-label={isKurdish ? 'سلایپەکەوە' : isArabic ? 'الشريحة السابقة' : 'Previous slide'}
        >
          {/* RemixIcon arrow */}
          <i className="ri-arrow-left-s-line text-2xl"></i>
          {/* Fallback text for when icon doesn't load */}
          <span className="ml-1 text-sm hidden">←</span>
        </button>
        <button
          onClick={nextSlide}
          className="text-[#bfbfbf] text-[0.8em] font-semibold flex items-center justify-center cursor-pointer select-none transition-colors duration-300 hover:text-[#ff0000]"
          aria-label={isKurdish ? 'سلایپێکەوە' : isArabic ? 'الشريحة التالية' : 'Next slide'}
        >
          {/* RemixIcon arrow */}
          <i className="ri-arrow-right-s-line text-2xl"></i>
          {/* Fallback text for when icon doesn't load */}
          <span className="mr-1 text-sm hidden">→</span>
        </button>
      </div>

      {/* Pagination Bars - Slide Orders - styled according to original CSS (vertical on right) */}
      <div className="absolute right-[40px] top-1/2 -translate-y-1/2 flex flex-col gap-[6px] z-[888] max-[580px]:bottom-[280px] max-[580px]:right-[16px] max-[580px]:top-auto max-[580px]:translate-y-0">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-[3px] h-[25px] cursor-pointer transition-all duration-300 hover:bg-[#ff0000] ${
              index === currentSlide ? 'bg-[#ff0000]' : 'bg-white/50'
            }`}
            style={{ boxShadow: '0 5px 25px rgba(2,2,2,0.25)' }}
          />
        ))}
      </div>

      {/* Slide Indicator Bars - showing progress of each slide */}
      <div className="absolute bottom-0 left-0 w-full z-[888]">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`absolute bottom-0 left-0 h-[4px] bg-[#c70a0a] ${
              index === currentSlide ? 'transition-[width] duration-[8200ms] ease-linear' : 'w-0'
            }`}
            style={{
              width: index === currentSlide ? '100%' : '0%',
              transitionTimingFunction: 'linear'
            }}
          />
        ))}
      </div>

      {/* Video Modal */}
      {videoModal.open && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={closeVideo}
              className="absolute -top-12 right-0 text-white text-2xl hover:text-gray-300"
            >
              <i className="ri-close-line"></i>
            </button>
            <video
              src={videoModal.videoUrl}
              controls
              autoPlay
              className="w-full rounded-lg"
            />
            <p className="text-white text-center mt-4 text-lg">{videoModal.title}</p>
          </div>
        </div>
      )}
    </section>
  )
}
