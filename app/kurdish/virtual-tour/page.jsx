'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase-client'

const KU = { fontFamily: 'UniSalar, Tahoma, sans-serif' }

const normalizePath = (p) => {
  if (!p) return null
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  return p.startsWith('/') ? p : `/${p}`
}

export default function KurdishVirtualTour() {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [visible, setVisible]   = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    Promise.all([
      fetch('/api/settings?key=show_virtual_tour').then(r => r.json()).catch(() => ({ value: null })),
      supabase
        .from('virtual_tour_items')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
    ]).then(([setting, { data }]) => {
      if (setting.value === 'false') { setVisible(false); setLoading(false); return }
      const rows = data || []
      setItems(rows)
      if (rows.length) setSelected(rows[0])
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="w-12 h-12 border-2 border-[#c8a96e] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!visible) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(122,0,0,0.15)', border: '1px solid rgba(200,169,110,0.15)' }}>
          <i className="ri-compass-3-line text-3xl" style={{ color: '#c8a96e' }} />
        </div>
        <p className="text-gray-400 text-lg" style={KU}>ئێستا بەردەست نییە</p>
        <Link href="/kurdish" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors" style={KU}>
          <i className="ri-arrow-right-line" /> گەڕانەوە بۆ سەرەتا
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }} dir="rtl">

      {/* Hero header */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #2a0000 0%, #0a0a0a 100%)' }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, #c8a96e, transparent)' }} />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ background: 'rgba(122,0,0,0.3)', border: '1px solid rgba(200,169,110,0.3)' }}>
            <i className="ri-compass-3-line text-3xl" style={{ color: '#c8a96e' }} />
          </div>

          <div className="flex items-center justify-center gap-4 mb-3">
            <span className="block w-16 h-1 rounded-full" style={{ background: 'linear-gradient(to right, transparent, #c8a96e)' }} />
            <h1 className="text-4xl md:text-5xl font-black text-white" style={KU}>گەڕانی مەیدانی</h1>
            <span className="block w-16 h-1 rounded-full" style={{ background: 'linear-gradient(to left, transparent, #c8a96e)' }} />
          </div>
          <p className="text-gray-400 text-base" style={KU}>Virtual Tour</p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(200,169,110,0.3), transparent)' }} />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(122,0,0,0.15)', border: '1px solid rgba(200,169,110,0.15)' }}>
              <i className="ri-compass-3-line text-3xl" style={{ color: '#c8a96e' }} />
            </div>
            <p className="text-gray-400 text-lg" style={KU}>هێشتا گەڕانی مەیدانی نییە</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Sidebar list */}
            <div className="lg:w-72 shrink-0 space-y-2">
              {items.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="w-full text-right flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200"
                  style={{
                    background: selected?.id === item.id ? 'rgba(122,0,0,0.3)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${selected?.id === item.id ? 'rgba(200,169,110,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {item.image_url && (
                    <img src={normalizePath(item.image_url)} alt="" className="w-12 h-9 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate" style={KU}>{item.title_ku || item.title_en}</p>
                    <p className="text-xs text-gray-500 mt-0.5" style={KU}>#{idx + 1}</p>
                  </div>
                  {selected?.id === item.id && (
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#c8a96e' }} />
                  )}
                </button>
              ))}
            </div>

            {/* Main viewer */}
            {selected && (
              <div className="flex-1 min-w-0">
                {/* Embed viewer */}
                {selected.embed_url ? (
                  <div className="w-full rounded-2xl overflow-hidden mb-6" style={{ aspectRatio: '16/9', border: '1px solid rgba(200,169,110,0.2)' }}>
                    <iframe
                      src={selected.embed_url}
                      className="w-full h-full"
                      allowFullScreen
                      allow="xr-spatial-tracking"
                      title={selected.title_ku || selected.title_en || 'Virtual Tour'}
                    />
                  </div>
                ) : selected.image_url ? (
                  <div className="w-full rounded-2xl overflow-hidden mb-6" style={{ aspectRatio: '16/9', border: '1px solid rgba(200,169,110,0.2)', background: '#111' }}>
                    <img src={normalizePath(selected.image_url)} alt={selected.title_ku || ''} className="w-full h-full object-contain" />
                  </div>
                ) : null}

                {/* Info */}
                <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,169,110,0.12)' }}>
                  <h2 className="text-2xl font-black text-white mb-3" style={KU}>{selected.title_ku || selected.title_en}</h2>
                  {selected.description_ku && (
                    <p className="text-gray-400 leading-relaxed" style={KU}>{selected.description_ku}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center mt-12">
          <Link href="/kurdish"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all bg-red-700 hover:bg-red-800"
            style={KU}>
            <i className="ri-arrow-right-line" />
            گەڕانەوە بۆ سەرەتا
          </Link>
        </div>
      </div>

      <Link href="/kurdish"
        className="fixed bottom-6 left-6 z-40 w-12 h-12 flex items-center justify-center rounded-full text-white transition-all shadow-lg"
        style={{ background: '#7a0000', border: '1px solid rgba(200,169,110,0.4)', boxShadow: '0 4px 20px rgba(122,0,0,0.5)' }}
        title="گەڕانەوە بۆ سەرەتا">
        <i className="ri-home-5-line text-lg" />
      </Link>
    </div>
  )
}
