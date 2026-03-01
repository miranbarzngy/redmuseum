'use client'

import { useState } from 'react'

export default function VRSection({ currentLang = 'en' }) {
  const isKurdish = currentLang === 'ku'
  const [showVideo, setShowVideo] = useState(false)

  const handlePlayClick = () => {
    setShowVideo(true)
  }

  return (
    <section id="virtual-tour" className="py-20 bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Title */}
        <h2 
          className="text-4xl font-bold text-center text-white mb-4"
          style={isKurdish ? { fontFamily: 'UniSalar, Tahoma, sans-serif' } : {}}
        >
          {isKurdish ? 'بەشێوەی ٣٦٠ پلە مۆزەخانەکە ببینە' : 'Explore Our Place in 360°'}
        </h2>
        
        {/* Description */}
        <p 
          className="text-center text-gray-300 mb-8"
          style={isKurdish ? { fontFamily: 'UniSalar, Tahoma, sans-serif' } : {}}
        >
          {isKurdish ? 'گەشتێکی خەیاڵی لەناو مۆزەخانەکەدا بکە' : 'Experience a virtual tour of our location!'}
        </p>

        {/* Video Container - Enhanced cropping to completely hide YouTube title */}
        <div className="max-w-4xl mx-auto">
          <div 
            className="w-full overflow-hidden rounded-lg shadow-2xl relative"
            style={{ 
              aspectRatio: '16/9',
              border: '2px solid rgba(255,255,255,0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Thumbnail Overlay - Shows when video is not playing */}
            {!showVideo && (
              <div 
                className="absolute inset-0 z-10 cursor-pointer group"
                onClick={handlePlayClick}
              >
                {/* Cover Image - Using VR cover image */}
                <img 
                  src="/assets/images/vr-cover.png" 
                  alt="Amna Suraka Museum VR Tour"
                  className="w-full h-full object-cover"
                />
                
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>
                
                {/* 360° Badge */}
                <div 
                  className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full font-bold text-sm"
                  style={isKurdish ? { fontFamily: 'UniSalar, Tahoma, sans-serif' } : {}}
                >
                  360°
                </div>
                
                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg 
                      className="w-10 h-10 text-white ml-1" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                
                {/* Click to Explore Text */}
                <div className="absolute bottom-8 left-0 right-0 text-center">
                  <span 
                    className="inline-block bg-black/60 text-white px-6 py-2 rounded-full text-sm font-medium"
                    style={isKurdish ? { fontFamily: 'UniSalar, Tahoma, sans-serif' } : {}}
                  >
                    {isKurdish ? 'کلیک بکە بۆ ئەزموون' : 'Click to Explore'}
                  </span>
                </div>
              </div>
            )}
            
            {/* YouTube iframe - Only renders when showVideo is true */}
            {showVideo && (
              <iframe 
                src="https://www.youtube.com/embed/rk5SYOLk3UQ?start=33&rel=0&modestbranding=1&autoplay=1&mute=1"
                title="VR Tour of Amna Suraka Museum"
                className="w-full h-full"
                style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '100%',
                  height: '100%',
                  transform: 'scale(1.3) translateY(-5%)',
                  transformOrigin: 'center center'
                }}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            {isKurdish 
              ? 'مۆزەخانەی نیشتمانی ئەمنە سورەکە - سلێمانی، کوردستان'
              : 'Amna Suraka National Museum - Sulaymaniyah, Kurdistan'
            }
          </p>
        </div>
      </div>
    </section>
  )
}
