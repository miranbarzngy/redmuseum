'use client'

import { useState, useEffect } from 'react'

export default function PushDebugPage() {
  const [logs, setLogs] = useState([])
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('fcm_debug')
    setLogs(raw ? JSON.parse(raw) : [])
  }, [])

  function refresh() {
    const raw = localStorage.getItem('fcm_debug')
    setLogs(raw ? JSON.parse(raw) : [])
    setCleared(false)
  }

  function clear() {
    localStorage.removeItem('fcm_debug')
    setLogs([])
    setCleared(true)
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff', padding: 16, fontFamily: 'monospace' }}>
      <h1 style={{ color: '#c8a96e', marginBottom: 8, fontSize: 16 }}>FCM Push Debug</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={refresh} style={{ background: '#222', color: '#fff', border: '1px solid #444', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
          Refresh
        </button>
        <button onClick={clear} style={{ background: '#400', color: '#fff', border: '1px solid #600', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
          Clear
        </button>
      </div>

      {cleared && <p style={{ color: '#888', marginBottom: 12 }}>Cleared. Log out and back in to re-run init.</p>}

      {logs.length === 0 && !cleared && (
        <p style={{ color: '#888' }}>No logs yet. Open the admin panel in this APK and wait 15 seconds, then tap Refresh.</p>
      )}

      {logs.map((l, i) => (
        <div key={i} style={{ marginBottom: 10, borderLeft: '3px solid #c8a96e44', paddingLeft: 10 }}>
          <div style={{ color: '#c8a96e', fontSize: 13 }}>{l.step}</div>
          <div style={{ color: '#aaa', fontSize: 11 }}>{l.ts}</div>
          {l.data !== null && (
            <pre style={{ color: '#ccc', fontSize: 11, margin: '4px 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(l.data, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  )
}
