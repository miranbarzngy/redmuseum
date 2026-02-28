'use client'

export default function VRSection({ currentLang = 'en' }) {
  const isKurdish = currentLang === 'ku'

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
            className="w-full overflow-hidden rounded-lg shadow-2xl"
            style={{ 
              aspectRatio: '16/9',
              border: '2px solid rgba(255,255,255,0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <iframe 
              src="https://www.youtube.com/embed/rk5SYOLk3UQ?start=33&rel=0&modestbranding=1"
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
