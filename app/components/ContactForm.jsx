'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase-client'

// Map icon names to Remix Icon class names
const SOCIAL_ICONS = {
  'ri-facebook-fill': 'ri-facebook-fill',
  'ri-instagram-line': 'ri-instagram-line',
  'ri-youtube-fill': 'ri-youtube-fill',
  'ri-tiktok-fill': 'ri-tiktok-fill',
  'ri-twitter-x-fill': 'ri-twitter-x-fill',
  'ri-linkedin-box-fill': 'ri-linkedin-box-fill',
}

export default function ContactForm({ currentLang = 'en' }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [settings, setSettings] = useState(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [errors, setErrors] = useState({})

  const isKurdish = currentLang === 'ku'
  const isArabic = currentLang === 'ar'

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single()

      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.log('Error fetching settings:', error)
    } finally {
      setSettingsLoading(false)
    }
  }

  // Get localized contact info
  const phone = settings?.contact_phone || '+964 0770 000000'
  const email = settings?.contact_email || 'info@amnasuraka.com'
  const address = isArabic 
    ? (settings?.address_ar || 'السليمانية، العراق')
    : isKurdish 
      ? (settings?.contact_address_kr || 'شاری سلێمانی')
      : (settings?.contact_address_en || 'Sulaymaniyah, Iraq')
  
  // Get social links from settings
  const socialLinks = settings?.social_json || []

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000)
  }

  // Helper function for translations
  const t = (kur, arb, eng) => {
    if (isArabic) return arb
    if (isKurdish) return kur
    return eng
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Check name
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = t('ناوی سیانی پێویستە', 'الاسم الكامل مطلوب', 'Full name is required')
    }
    
    // Check phone
    if (!formData.phone || formData.phone.trim() === '') {
      newErrors.phone = t('ژمارەی مۆبایل پێویستە', 'رقم الهاتف مطلوب', 'Phone number is required')
    }
    
    // Check email
    if (!formData.email || formData.email.trim() === '') {
      newErrors.email = t('ئیمەیڵ پێویستە', 'البريد الإلكتروني مطلوب', 'Email is required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('ئیمەیڵەکەت دروست نیە', 'الرجاء إدخال بريد إلكتروني صالح', 'Please enter a valid email')
    }
    
    // Check message
    if (!formData.message || formData.message.trim() === '') {
      newErrors.message = t('پەیام پێویستە', 'الرسالة مطلوبة', 'Message is required')
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form before submission
    if (!validateForm()) {
      showToast(
        t('تکایە هەموو خانە پڕبکەرەوە', 'الرجاء ملء جميع الحقول المطلوبة', 'Please fill in all required fields'),
        'error'
      )
      return
    }
    
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
          created_at: new Date().toISOString()
        }])

      if (error) throw error

      showToast(t('پەیامەکەت بە سەرکەوتوویی نێرا!', 'تم إرسال الرسالة بنجاح!', 'Message sent successfully!'), 'success')
      setFormData({ name: '', phone: '', email: '', message: '' })
      setErrors({})
    } catch (error) {
      console.error('Error:', error)
      showToast(t('هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵبدەرەوە.', 'حدث خطأ. يرجى المحاولة مرة أخرى.', 'Error sending message. Please try again.'), 'error')
    } finally {
      setLoading(false)
    }

  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  return (
    <section id="contact" className="py-20 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">
          {t('پەیوەندی بکە', 'اتصل بنا', 'Contact Us')}
        </h2>

        <div className="max-w-4xl mx-auto">
          {/* Contact Info - Now from database */}
          {settingsLoading ? (
            <div className="flex justify-center mb-12">
              <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <i className="ri-phone-line text-3xl mb-4 text-blue-400"></i>
                <p>{phone}</p>
              </div>
              <div className="text-center">
                <i className="ri-mail-line text-3xl mb-4 text-blue-400"></i>
                <p>{email}</p>
              </div>
              <div className="text-center">
                <i className="ri-map-pin-line text-3xl mb-4 text-blue-400"></i>
                <p>{address}</p>
              </div>
            </div>
          )}

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <span className="text-red-500">*</span> {t('ناوی تەواو', 'الاسم الكامل', 'Full Name')}
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder={t('ناوی سیانی', 'اسمك الكامل', 'Your Name')}
                  value={formData.name}
                  onChange={handleChange}
                  required
                  dir={isArabic ? 'rtl' : 'ltr'}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg focus:outline-none focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-white/20'
                  }`}
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <span className="text-red-500">*</span> {t('ژمارەی مۆبایل', 'رقم الهاتف', 'Phone Number')}
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder={t('ژمارەی مۆبایل', 'رقم الهاتف', 'Phone Number')}
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  dir={isArabic ? 'rtl' : 'ltr'}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg focus:outline-none focus:border-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-white/20'
                  }`}
                />
                {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                <span className="text-red-500">*</span> {t('ئیمەیڵ', 'البريد الإلكتروني', 'Email')}
              </label>
              <input
                type="email"
                name="email"
                placeholder={t('ئیمەیڵ', 'بريدك الإلكتروني', 'Your Email')}
                value={formData.email}
                onChange={handleChange}
                required
                dir={isArabic ? 'rtl' : 'ltr'}
                className={`w-full px-4 py-3 bg-white/10 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-white/20'
                }`}
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                <span className="text-red-500">*</span> {t('پەیام', 'الرسالة', 'Message')}
              </label>
              <textarea
                name="message"
                rows="5"
                placeholder={t('پەیام', 'رسالتك', 'Your Message')}
                value={formData.message}
                onChange={handleChange}
                required
                dir={isArabic ? 'rtl' : 'ltr'}
                className={`w-full px-4 py-3 bg-white/10 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.message ? 'border-red-500' : 'border-white/20'
                }`}
              />
              {errors.message && <p className="text-red-400 text-sm mt-1">{errors.message}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
            >
              {loading 
                ? t('ناردن...', 'جاري الإرسال...', 'Sending...')
                : t('پەیامەکەت بنێرە', 'إرسال الرسالة', 'Send Message')
              }
            </button>
          </form>


          {/* Social Media Links - From Database */}
          {socialLinks && socialLinks.length > 0 && (
            <div className="flex justify-center space-x-6 mt-12">
              {socialLinks.map((link) => (
                link.url && (
                  <a 
                    key={link.id || link.platform_name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-2xl hover:text-blue-400 transition-colors"
                    title={link.platform_name}
                  >
                    <i className={link.icon_name || 'ri-links-line'}></i>
                  </a>
                )
              ))}
            </div>
          )}

          {/* Fallback social icons if no database links */}
          {(!socialLinks || socialLinks.length === 0) && (
            <div className="flex justify-center space-x-6 mt-12">
              <a href="#" className="text-2xl hover:text-blue-400 transition-colors">
                <i className="ri-facebook-fill"></i>
              </a>
              <a href="#" className="text-2xl hover:text-pink-400 transition-colors">
                <i className="ri-instagram-line"></i>
              </a>
              <a href="#" className="text-2xl hover:text-gray-400 transition-colors">
                <i className="ri-tiktok-fill"></i>
              </a>
            </div>
          )}
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
