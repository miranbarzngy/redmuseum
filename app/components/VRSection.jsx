'use client'

import { useState } from 'react'

export default function VRSection({ currentLang = 'en' }) {
  const isKu = currentLang === 'ku'
  const isAr = currentLang === 'ar'
  const [showVideo, setShowVideo] = useState(false)

  const font = isKu ? { fontFamily: 'UniSalar, Tahoma, sans-serif' }
             : isAr ? { fontFamily: 'Cairo, Tahoma, sans-serif' }
             : {}

  const t = (ku, ar, en) => isAr ? ar : isKu ? ku : en

  const title    = t('بەشێوەی ٣٦٠ پلە مۆزەخانەکە ببینە', 'استكشف مكاننا بزاوية 360°',     'Explore Our Place in 360°')
  const subtitle = t('گەشتێکی خەیاڵی لەناو مۆزەخانەکەدا بکە', 'استمتع بجولة افتراضية في موقعنا!', 'Experience a virtual tour of our location!')
  const explore  = t('کلیک بکە بۆ ئەزموون', 'انقر للاستكشاف', 'Click to Explore')
  const caption  = t('مۆزەخانەی نیشتمانی ئەمنە سورەکە - سلێمانی، کوردستان', 'متحف أمنة سراكر الوطني - السليمانية، كوردستان', 'Amna Suraka National Museum - Sulaymaniyah, Kurdistan')

  return (
    <section id="virtual-tour" className="py-16" style={{ background: '#0a0f1e' }}>
      <div className="container mx-auto px-4 md:px-8 lg:px-16">

        {/* Section header */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-4 mb-3">
            <span className="block w-16 h-1 rounded-full" style={{ background: 'linear-gradient(to right, transparent, #cc0000)' }} />
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide text-center" style={font}>
              {title}
            </h2>
            <span className="block w-16 h-1 rounded-full" style={{ background: 'linear-gradient(to left, transparent, #cc0000)' }} />
          </div>
          <p className="text-white text-sm text-center" style={font}>{subtitle}</p>
        </div>

        {/* Video container */}
        <div className="max-w-4xl mx-auto">
          <div
            className="w-full overflow-hidden rounded-2xl relative"
            style={{
              aspectRatio: '16/9',
              border: '1px solid rgba(200,169,110,0.2)',
              boxShadow: '0 0 0 1px rgba(200,169,110,0.08), 0 32px 80px rgba(0,0,0,0.7)',
            }}
          >
            {/* Gold top accent */}
            <div className="absolute top-0 left-0 right-0 h-0.5 z-20"
              style={{ background: 'linear-gradient(to right, transparent, #c8a96e, transparent)' }} />

            {/* Thumbnail overlay */}
            {!showVideo && (
              <div className="absolute inset-0 z-10 cursor-pointer group" onClick={() => setShowVideo(true)}>
                <img
                  src="/assets/images/vr-cover.png"
                  alt="Amna Suraka Museum VR Tour"
                  className="w-full h-full object-cover"
                />

                {/* Dark overlay */}
                <div className="absolute inset-0 transition-colors duration-300"
                  style={{ background: 'rgba(0,0,0,0.45)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                />

                {/* 360° badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold text-white z-10"
                  style={{ background: '#7a0000', border: '1px solid rgba(200,169,110,0.4)', boxShadow: '0 4px 12px rgba(122,0,0,0.5)', ...font }}>
                  <i className="ri-vip-crown-line text-[#c8a96e] text-xs" />
                  360°
                </div>

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="relative w-20 h-20 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ background: 'rgba(122,0,0,0.85)', border: '2px solid rgba(200,169,110,0.5)', boxShadow: '0 0 0 8px rgba(122,0,0,0.2), 0 8px 32px rgba(0,0,0,0.6)' }}
                  >
                    <i className="ri-play-fill text-white text-3xl ml-1" />
                  </div>
                </div>

                {/* Explore button */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                  <span
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
                    style={{ background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(200,169,110,0.3)', backdropFilter: 'blur(8px)', ...font }}
                  >
                    <i className="ri-compass-3-line text-[#c8a96e]" />
                    {explore}
                  </span>
                </div>
              </div>
            )}

            {/* YouTube iframe */}
            {showVideo && (
              <iframe
                src="https://www.youtube.com/embed/rk5SYOLk3UQ?start=33&rel=0&modestbranding=1&autoplay=1&mute=1"
                title="VR Tour of Amna Suraka Museum"
                className="absolute inset-0 w-full h-full"
                style={{ transform: 'scale(1.3) translateY(-5%)', transformOrigin: 'center center' }}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>

          {/* Caption */}
          <p className="text-center text-white text-xs mt-4 flex items-center justify-center gap-2" style={font}>
            <i className="ri-map-pin-line text-[#c8a96e]" />
            {caption}
          </p>
        </div>

      </div>
    </section>
  )
}
