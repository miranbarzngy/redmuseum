'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase-client'
import { useMuseumName } from '../lib/useMuseumName'

export default function AdminLogin() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [isConfigured, setIsConfigured] = useState(true)
  const museumName = useMuseumName()
  const router = useRouter()

  useEffect(() => {
    if (!supabase) setIsConfigured(false)
  }, [])

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div
          className="p-8 rounded-2xl w-full max-w-md text-center"
          style={{ background: '#111', border: '1px solid rgba(200,169,110,0.2)' }}
        >
          <p className="text-red-400 font-semibold mb-2">Configuration Error</p>
          <p className="text-gray-400 text-sm">Supabase credentials are not configured. Check your .env.local file.</p>
          <a href="/" className="mt-4 inline-block text-sm text-[#c8a96e] hover:text-[#e0c080]">← Back to Website</a>
        </div>
      </div>
    )
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      if (data.user) {
        if (data.session?.access_token) {
          document.cookie = 'sb-access-token=' + data.session.access_token + '; path=/; max-age=3600'
        }
        window.location.replace('/admin/slides')
      } else {
        setError('Authentication failed — no user data')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#0a0a0a' }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(120,0,0,0.18) 0%, transparent 70%)',
        }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0d0000 0%, #140000 50%, #0a0a0a 100%)',
          border: '1px solid rgba(200,169,110,0.2)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)',
        }}
      >
        {/* Top gold highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/50 to-transparent" />

        {/* Museum header */}
        <div
          className="px-8 pt-8 pb-6 flex flex-col items-center"
          style={{ background: 'linear-gradient(180deg, rgba(100,0,0,0.3) 0%, transparent 100%)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/android-chrome-192x192.png"
            alt="Museum Logo"
            className="w-16 h-16 rounded-2xl object-cover mb-3"
            style={{ background: '#ffffff', border: '1px solid rgba(200,169,110,0.35)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
          />
          <p
            className="text-white font-bold text-center leading-snug text-base"
            style={{ fontFamily: 'UniSalar, Tahoma, sans-serif', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
          >
            {museumName.kr}
          </p>
          <p className="text-[#c8a96e]/70 text-xs tracking-[0.25em] uppercase mt-1">{museumName.en}</p>
        </div>

        {/* Gold separator */}
        <div className="mx-8 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/40 to-transparent" />

        {/* Form area */}
        <div className="px-8 py-7">
          <h1 className="text-white font-bold text-xl text-center mb-6 tracking-wide">
            Admin Login
          </h1>

          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm text-red-300 text-center"
              style={{ background: 'rgba(180,0,0,0.15)', border: '1px solid rgba(200,0,0,0.3)' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#c8a96e]/80 uppercase tracking-[0.2em] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(200,169,110,0.2)',
                  caretColor: '#c8a96e',
                }}
                onFocus={e => e.target.style.border = '1px solid rgba(200,169,110,0.6)'}
                onBlur={e => e.target.style.border = '1px solid rgba(200,169,110,0.2)'}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#c8a96e]/80 uppercase tracking-[0.2em] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(200,169,110,0.2)',
                  caretColor: '#c8a96e',
                }}
                onFocus={e => e.target.style.border = '1px solid rgba(200,169,110,0.6)'}
                onBlur={e => e.target.style.border = '1px solid rgba(200,169,110,0.2)'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm tracking-widest uppercase transition-all mt-2 disabled:opacity-50"
              style={{
                background: loading
                  ? 'rgba(100,0,0,0.5)'
                  : 'linear-gradient(135deg, #7a0000 0%, #cc0000 50%, #7a0000 100%)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(180,0,0,0.4)',
                border: '1px solid rgba(255,100,100,0.2)',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/kurdish"
              className="text-sm text-[#c8a96e]/60 hover:text-[#c8a96e] transition-colors"
            >
              ← Back to Website
            </a>
          </div>
        </div>

        {/* Gold bottom bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#c8a96e] via-[#7a0000] to-[#c8a96e]" />
      </div>
    </div>
  )
}
