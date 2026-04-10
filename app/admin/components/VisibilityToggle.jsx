'use client'

import { useState, useEffect } from 'react'

/**
 * Reusable section visibility toggle for admin pages.
 * Reads/writes a boolean value in site_settings by `settingKey`.
 *
 * Props:
 *   settingKey  – e.g. 'show_gallery'
 *   label       – e.g. 'Gallery Section'
 *   description – optional human-readable hint
 */
export default function VisibilityToggle({ settingKey, label, description }) {
  const [visible, setVisible] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch(`/api/settings?key=${settingKey}`)
      .then(r => r.json())
      .then(json => {
        // Default to true (visible) if key not yet in DB
        if (json.value !== null && json.value !== undefined) {
          setVisible(json.value === 'true')
        }
      })
      .catch(() => {})
  }, [settingKey])

  const toggle = async () => {
    setToggling(true)
    const newVal = !visible
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: settingKey, value: String(newVal) }),
      })
      if (!res.ok) throw new Error()
      setVisible(newVal)
      setMsg(newVal ? 'Visible on public site' : 'Hidden from public site')
    } catch {
      setMsg('Failed to save')
    } finally {
      setToggling(false)
      setTimeout(() => setMsg(''), 2500)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold text-gray-800">{label} Visibility</p>
        <p className="text-sm text-gray-500 mt-0.5">
          {msg || (description
            ? description
            : visible
              ? `${label} is visible on the public site`
              : `${label} is hidden from the public site`
          )}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={toggling}
        className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-60 ${visible ? 'bg-green-500' : 'bg-gray-300'}`}
        aria-label="Toggle visibility"
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${visible ? 'translate-x-8' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}
