'use client'

import { useEffect, useState } from 'react'
import { Globe, Lock } from 'lucide-react'
import Image from 'next/image'

const LANGUAGES = [
  {
    key: null,
    code: 'ku',
    name: 'Kurdish',
    native: 'کوردی',
    flag: '/assets/images/Flag_of_Kurdistan.png',
    flagLocal: true,
    locked: true,
    description: 'Default language — always active',
  },
  {
    key: 'show_english',
    code: 'en',
    name: 'English',
    native: 'English',
    flag: 'https://flagcdn.com/w80/gb.png',
    flagLocal: false,
    locked: false,
    description: 'Show English language option to visitors',
  },
  {
    key: 'show_arabic',
    code: 'ar',
    name: 'Arabic',
    native: 'العربية',
    flag: 'https://flagcdn.com/w80/iq.png',
    flagLocal: false,
    locked: false,
    description: 'Show Arabic language option to visitors',
  },
]

function LangCard({ lang, enabled, saving, onToggle }) {
  return (
    <div className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
      lang.locked ? 'border-gray-100' : enabled ? 'border-emerald-200 shadow-md shadow-emerald-50' : 'border-gray-100 opacity-70'
    }`}>
      <div className="p-5 flex items-center gap-4">
        {/* Flag */}
        <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 bg-gray-50 flex items-center justify-center shadow-sm">
          <Image
            src={lang.flag}
            alt={lang.name}
            width={56}
            height={56}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-gray-900">{lang.name}</span>
            <span className="text-sm text-gray-400">·</span>
            <span className="text-sm text-gray-500" style={lang.code === 'ku' || lang.code === 'ar' ? { fontFamily: 'UniSalar, Tahoma, sans-serif' } : {}}>
              {lang.native}
            </span>
            {lang.locked && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Lock size={10} />
                Default
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{lang.description}</p>
        </div>

        {/* Toggle */}
        <div className="flex-shrink-0">
          {lang.locked ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                Always On
              </span>
            </div>
          ) : (
            <button
              onClick={onToggle}
              disabled={saving}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 flex-shrink-0 focus:outline-none ${
                saving ? 'opacity-60 cursor-wait' : 'cursor-pointer'
              } ${enabled ? 'bg-emerald-500' : 'bg-gray-200'}`}
              title={enabled ? 'Disable' : 'Enable'}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                  enabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Status bar */}
      {!lang.locked && (
        <div className={`h-1 transition-all duration-300 ${enabled ? 'bg-emerald-400' : 'bg-gray-100'}`} />
      )}
    </div>
  )
}

export default function LanguagesPage() {
  const [settings, setSettings] = useState({ show_english: true, show_arabic: true })
  const [saving, setSaving] = useState({})
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const keys = ['show_english', 'show_arabic']
    keys.forEach(key => {
      fetch(`/api/settings?key=${key}`)
        .then(r => r.json())
        .then(json => {
          if (json.value !== null && json.value !== undefined) {
            setSettings(prev => ({ ...prev, [key]: json.value === 'true' }))
          }
        })
        .catch(() => {})
    })
  }, [])

  const toggle = async (key) => {
    const newVal = !settings[key]
    setSaving(prev => ({ ...prev, [key]: true }))
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: String(newVal) }),
      })
      if (!res.ok) throw new Error()
      setSettings(prev => ({ ...prev, [key]: newVal }))
      setToast({ type: 'success', msg: `${key === 'show_english' ? 'English' : 'Arabic'} ${newVal ? 'enabled' : 'disabled'}` })
    } catch {
      setToast({ type: 'error', msg: 'Failed to save setting' })
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }))
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <div className="max-w-2xl mx-auto pt-8 pb-16 px-2">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-sky-900 flex items-center justify-center shadow-lg shadow-sky-950/40">
            <Globe size={19} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Language Settings</h1>
        </div>
        <p className="text-sm text-gray-500 mt-2 ml-1">
          Control which languages are available to visitors in the sidebar. Kurdish is always active as the default language.
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {LANGUAGES.map(lang => (
          <LangCard
            key={lang.code}
            lang={lang}
            enabled={lang.locked ? true : settings[lang.key]}
            saving={lang.key ? !!saving[lang.key] : false}
            onToggle={lang.key ? () => toggle(lang.key) : undefined}
          />
        ))}
      </div>

      {/* Info note */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 flex items-start gap-2">
        <Globe size={14} className="mt-0.5 flex-shrink-0" />
        <span>Changes take effect immediately for new visitors. Active visitors may need to refresh their page.</span>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl transition-all ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
