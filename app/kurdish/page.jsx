'use client'

import Navbar from '../components/Navbar'
import Slider from '../components/Slider'
import About from '../components/About'
import Gallery from '../components/Gallery'
import ContactForm from '../components/ContactForm'

export default function KurdishPage() {
  return (
    <main dir="rtl">
      <Navbar currentLang="ku" />
      <Slider currentLang="ku" />
      <About currentLang="ku" />
      
      {/* Virtual Tour Section */}
      <section id="virtual-tour" className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-white mb-8">
            بینینی بەشەکانی مۆزەخانە بەشیوەی ٣٦٠
          </h2>
          <p className="text-center text-gray-300 mb-8">
            گەشتێکی تایبەت بکە بە ناو مۆزەخانەدا
          </p>
          <div className="max-w-4xl mx-auto">
            <iframe 
              src="https://cdn.pannellum.org/2.5/pannellum.htm#panorama=https://pannellum.org/images/alma.jpg"
              className="w-full h-96 rounded-lg"
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>
      
      <Gallery currentLang="ku" />
      <ContactForm currentLang="ku" />
      
      {/* Footer */}
      <footer className="py-6 bg-black text-white text-center">
        <p>© ٢٠٢٥ مۆزەخانەی نیشتمانی ئەمنە سورەکە. هەموو مافەکان پارێزراوە.</p>
      </footer>
    </main>
  )
}
