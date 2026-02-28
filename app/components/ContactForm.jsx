'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ContactForm({ currentLang = 'en' }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  const isKurdish = currentLang === 'ku'

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          message: formData.message,
          created_at: new Date().toISOString()
        }])

      if (error) throw error

      showToast(isKurdish ? 'پەیامەکەت بە سەرکەوتوویی نێرا!' : 'Message sent successfully!', 'success')
      setFormData({ name: '', phone: '', email: '', message: '' })
    } catch (error) {
      console.error('Error:', error)
      showToast(isKurdish ? 'هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵبدەرەوە.' : 'Error sending message. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contact" className="py-20 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">
          {isKurdish ? 'پەیوەندی بکە' : 'Contact Us'}
        </h2>

        <div className="max-w-4xl mx-auto">
          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <i className="ri-phone-line text-3xl mb-4 text-blue-400"></i>
              <p>+964 0770 000000</p>
            </div>
            <div className="text-center">
              <i className="ri-mail-line text-3xl mb-4 text-blue-400"></i>
              <p>info@amnasuraka.com</p>
            </div>
            <div className="text-center">
              <i className="ri-map-pin-line text-3xl mb-4 text-blue-400"></i>
              <p>{isKurdish ? 'شاری سلێمانی' : 'Sulaymaniyah, Iraq'}</p>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder={isKurdish ? 'ناوی سیانی' : 'Your Name'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder={isKurdish ? 'ژمارەی مۆبایل' : 'Phone Number'}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <input
              type="email"
              placeholder={isKurdish ? 'ئیمەیڵ' : 'Your Email'}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <textarea
              rows="5"
              placeholder={isKurdish ? 'پەیام' : 'Your Message'}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
            >
              {loading 
                ? (isKurdish ? 'ناردن...' : 'Sending...') 
                : (isKurdish ? 'پەیامەکەت بنێرە' : 'Send Message')
              }
            </button>
          </form>

          {/* Social Media */}
          <div className="flex justify-center space-x-6 mt-12">
            <a href="#" className="text-2xl hover:text-blue-400 transition-colors">
              <i className="ri-facebook-fill"></i>
            </a>
            <a href="#" className="text-2xl hover:text-pink-400 transition-colors">
              <i className="ri-instagram-line"></i>
            </a>
            <a href="#" className="text-2xl hover:text-gray-400 transition-colors">
              <i className="ri-tiktok-line"></i>
            </a>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 px-6 py-3 rounded-lg text-white animate-slide-in ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          <i className={`mr-2 ${toast.type === 'success' ? 'ri-check-circle-fill' : 'ri-error-warning-fill'}`}></i>
          {toast.message}
        </div>
      )}
    </section>
  )
}
