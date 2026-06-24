'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase-client'

export default function ContactForm({ currentLang = 'en' }) {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' })
  const [loading,         setLoading]         = useState(false)
  const [toast,           setToast]           = useState({ show: false, message: '', type: 'success' })
  const [settings,        setSettings]        = useState(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [errors,          setErrors]          = useState({})

  const isKu = currentLang === 'ku'
  const isAr = currentLang === 'ar'
  const isRtl = isKu || isAr
  const font = isKu ? { fontFamily: 'UniSalar, Tahoma, sans-serif' }
             : isAr ? { fontFamily: 'ArabicFont, Tahoma, sans-serif' }
             : {}

  const t = (ku, ar, en) => isAr ? ar : isKu ? ku : en

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').single()
      if (data) setSettings(data)
    } catch {}
    finally { setSettingsLoading(false) }
  }

  const phone   = settings?.contact_phone || '+964 0770 000000'
  const email   = settings?.contact_email || 'info@amnasuraka.com'
  const address = isAr
    ? (settings?.address_ar || 'السليمانية، العراق')
    : isKu
      ? (settings?.contact_address_kr || 'شاری سلێمانی')
      : (settings?.contact_address_en || 'Sulaymaniyah, Iraq')

  const socialLinks = settings?.social_json || []

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000)
  }

  const validateForm = () => {
    const e = {}
    if (!formData.name.trim())    e.name    = t('ناوی سیانی پێویستە',   'الاسم الكامل مطلوب',               'Full name is required')
    if (!formData.phone.trim())   e.phone   = t('ژمارەی مۆبایل پێویستە', 'رقم الهاتف مطلوب',                 'Phone number is required')
    if (!formData.email.trim())   e.email   = t('ئیمەیڵ پێویستە',        'البريد الإلكتروني مطلوب',          'Email is required')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
                                  e.email   = t('ئیمەیڵەکەت دروست نیە',  'الرجاء إدخال بريد إلكتروني صالح', 'Please enter a valid email')
    if (!formData.message.trim()) e.message = t('پەیام پێویستە',          'الرسالة مطلوبة',                   'Message is required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      showToast(t('تکایە هەموو خانەکان پڕبکەرەوە', 'الرجاء ملء جميع الحقول المطلوبة', 'Please fill in all required fields'), 'error')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.from('messages').insert([{
        name: formData.name.trim(), phone: formData.phone.trim(),
        email: formData.email.trim(), message: formData.message.trim(),
        created_at: new Date().toISOString(),
      }])
      if (error) throw error
      showToast(t('پەیامەکەت بە سەرکەوتوویی نێرا!', 'تم إرسال الرسالة بنجاح!', 'Message sent successfully!'), 'success')
      setFormData({ name: '', phone: '', email: '', message: '' })
      setErrors({})
    } catch {
      showToast(t('هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵبدەرەوە.', 'حدث خطأ. يرجى المحاولة مرة أخرى.', 'Error sending message. Please try again.'), 'error')
    } finally { setLoading(false) }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: null }))
  }

  const inputCls = (key) => ({
    background: errors[key] ? 'rgba(239,68,68,0.06)' : '#f5f5f3',
    border: `1px solid ${errors[key] ? 'rgba(239,68,68,0.5)' : 'rgba(0,0,0,0.12)'}`,
    color: '#1c1917',
  })

  const contactItems = [
    { icon: 'ri-map-pin-2-line',  value: address },
    { icon: 'ri-mail-send-line',  value: email   },
    { icon: 'ri-phone-line',      value: phone   },
  ]

  return (
    <section id="contact" className="text-stone-900 h-[calc(100dvh-4rem)] md:h-screen overflow-hidden flex flex-col py-4 md:py-8" style={{ background: settings?.contact_bg_color || '#fbfbfa' }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col flex-1 min-h-0">

        {/* Section header */}
        <div className="flex flex-col items-center mb-3 md:mb-6 flex-shrink-0">
          <div className="flex items-center gap-3 md:gap-4 mb-1 md:mb-2">
            <span className="block w-10 md:w-16 h-1 rounded-full" style={{ background: 'linear-gradient(to right, transparent, #c8a96e)' }} />
            <h2 className="text-xl sm:text-2xl md:text-3xl xl:text-4xl font-black text-stone-900 tracking-wide" style={font}>
              {t('پەیوەندی بکە', 'اتصل بنا', 'Contact Us')}
            </h2>
            <span className="block w-10 md:w-16 h-1 rounded-full" style={{ background: 'linear-gradient(to left, transparent, #c8a96e)' }} />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-px" style={{ background: 'linear-gradient(to right, transparent, #c8a96e)' }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#c8a96e' }} />
            <div className="w-8 h-px" style={{ background: 'linear-gradient(to left, transparent, #c8a96e)' }} />
          </div>
        </div>

        {/* Scrollable content — graceful fallback on very short screens */}
        <div className="max-w-3xl mx-auto w-full flex-1 min-h-0 overflow-y-auto">

          {/* Contact info cards */}
          {settingsLoading ? (
            <div className="flex justify-center mb-3">
              <div className="w-8 h-8 border-2 border-[#c8a96e] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-3 md:mb-6">
              {contactItems.map(({ icon, value }) => (
                <div key={icon} className="flex flex-col items-center gap-1.5 md:gap-2 py-2.5 md:py-4 px-2 md:px-3 rounded-xl md:rounded-2xl text-center"
                  style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(122,0,0,0.85)', border: '1px solid rgba(200,169,110,0.25)' }}>
                    <i className={`${icon} text-sm md:text-base`} style={{ color: '#c8a96e' }} />
                  </div>
                  <p className="text-stone-600 text-[9px] md:text-xs break-all leading-snug" style={font}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2 md:space-y-3" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="rounded-xl md:rounded-2xl p-3 md:p-5 space-y-2.5 md:space-y-4"
              style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

              {/* Gold top accent */}
              <div className="h-px -mx-3 md:-mx-5 -mt-3 md:-mt-5 mb-2.5 md:mb-4 rounded-t-2xl"
                style={{ background: 'linear-gradient(to right, transparent, #c8a96e, transparent)' }} />

              {/* Name + Phone */}
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <div>
                  <label className="block text-xs md:text-sm font-semibold mb-1" style={{ color: '#1c1917', ...font }}>
                    <span style={{ color: '#c8a96e' }}>* </span>{t('ناوی تەواو', 'الاسم الكامل', 'Full Name')}
                  </label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    placeholder={t('ناوی سیانی', 'اسمك الكامل', 'Your Name')}
                    className="w-full px-3 py-2 md:py-2.5 rounded-lg md:rounded-xl text-stone-900 text-sm placeholder-stone-400 focus:outline-none transition-all"
                    style={{ ...inputCls('name'), ...font }}
                    onFocus={e => { if (!errors.name) e.target.style.borderColor = '#c8a96e' }}
                    onBlur={e => { if (!errors.name) e.target.style.borderColor = 'rgba(0,0,0,0.12)' }}
                  />
                  {errors.name && <p className="text-red-400 text-[10px] mt-0.5" style={font}>{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold mb-1" style={{ color: '#1c1917', ...font }}>
                    <span style={{ color: '#c8a96e' }}>* </span>{t('ژمارەی مۆبایل', 'رقم الهاتف', 'Phone')}
                  </label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                    placeholder={t('مۆبایل', 'الهاتف', 'Phone')} dir="ltr"
                    className="w-full px-3 py-2 md:py-2.5 rounded-lg md:rounded-xl text-stone-900 text-sm placeholder-stone-400 focus:outline-none transition-all"
                    style={{ ...inputCls('phone') }}
                    onFocus={e => { if (!errors.phone) e.target.style.borderColor = '#c8a96e' }}
                    onBlur={e => { if (!errors.phone) e.target.style.borderColor = 'rgba(0,0,0,0.12)' }}
                  />
                  {errors.phone && <p className="text-red-400 text-[10px] mt-0.5" style={font}>{errors.phone}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs md:text-sm font-semibold mb-1" style={{ color: '#1c1917', ...font }}>
                  <span style={{ color: '#c8a96e' }}>* </span>{t('ئیمەیڵ', 'البريد الإلكتروني', 'Email')}
                </label>
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder={t('ئیمەیڵ', 'بريدك الإلكتروني', 'Your Email')} dir="ltr"
                  className="w-full px-3 py-2 md:py-2.5 rounded-lg md:rounded-xl text-stone-900 text-sm placeholder-stone-400 focus:outline-none transition-all"
                  style={{ ...inputCls('email') }}
                  onFocus={e => { if (!errors.email) e.target.style.borderColor = '#c8a96e' }}
                  onBlur={e => { if (!errors.email) e.target.style.borderColor = 'rgba(0,0,0,0.12)' }}
                />
                {errors.email && <p className="text-red-400 text-[10px] mt-0.5" style={font}>{errors.email}</p>}
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs md:text-sm font-semibold mb-1" style={{ color: '#1c1917', ...font }}>
                  <span style={{ color: '#c8a96e' }}>* </span>{t('پەیام', 'الرسالة', 'Message')}
                </label>
                <textarea name="message" rows={3} value={formData.message} onChange={handleChange}
                  placeholder={t('پەیام', 'رسالتك', 'Your Message')}
                  className="w-full px-3 py-2 md:py-2.5 rounded-lg md:rounded-xl text-stone-900 text-sm placeholder-stone-400 focus:outline-none transition-all resize-none"
                  style={{ ...inputCls('message'), ...font }}
                  onFocus={e => { if (!errors.message) e.target.style.borderColor = '#c8a96e' }}
                  onBlur={e => { if (!errors.message) e.target.style.borderColor = 'rgba(0,0,0,0.12)' }}
                />
                {errors.message && <p className="text-red-400 text-[10px] mt-0.5" style={font}>{errors.message}</p>}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 md:py-3.5 text-white font-bold text-sm md:text-base rounded-xl md:rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#7a0000', border: '1px solid rgba(200,169,110,0.4)', boxShadow: '0 8px 32px rgba(122,0,0,0.4)', ...font }}>
              {loading
                ? t('ناردن...', 'جاري الإرسال...', 'Sending...')
                : t('پەیامەکەت بنێرە', 'إرسال الرسالة', 'Send Message')
              }
            </button>
          </form>

          {/* Social links */}
          {(socialLinks?.length > 0 ? socialLinks : null) && (
            <div className="hidden md:flex justify-center gap-4 mt-5">
              {socialLinks.map(link =>
                link.url && /^https?:\/\//i.test(link.url) && (
                  <a key={link.id || link.platform_name} href={link.url} target="_blank" rel="noopener noreferrer"
                    title={link.platform_name}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-stone-500 hover:text-[#c8a96e] transition-colors"
                    style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)' }}>
                    <i className={`${link.icon_name || 'ri-links-line'} text-lg`} />
                  </a>
                )
              )}
            </div>
          )}

          {(!socialLinks || socialLinks.length === 0) && (
            <div className="hidden md:flex justify-center gap-4 mt-5">
              {[
                { icon: 'ri-facebook-fill', href: '#' },
                { icon: 'ri-instagram-line', href: '#' },
                { icon: 'ri-tiktok-fill', href: '#' },
              ].map(s => (
                <a key={s.icon} href={s.href}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-[#c8a96e] transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <i className={`${s.icon} text-lg`} />
                </a>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-xl transition-all"
          style={{ background: toast.type === 'success' ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
          <i className={toast.type === 'success' ? 'ri-check-circle-fill' : 'ri-error-warning-fill'} />
          <span style={font}>{toast.message}</span>
        </div>
      )}
    </section>
  )
}
