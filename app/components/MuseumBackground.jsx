'use client'

// [left%, top%, sizePx, durationS, delayS, gold, drift]
const PARTICLES = [
  [7,   15,  3, 28,  0,   true,  false],
  [19,  62,  2, 36,  4,   false, true ],
  [33,  8,   5, 42,  2,   true,  false],
  [48,  80,  2, 31,  9,   false, true ],
  [62,  32,  4, 39,  13,  true,  false],
  [78,  55,  2, 46,  3,   false, true ],
  [88,  18,  3, 33,  16,  true,  false],
  [5,   72,  6, 41,  7,   false, true ],
  [23,  44,  2, 37,  19,  true,  false],
  [42,  90,  4, 52,  1,   false, false],
  [57,  25,  3, 34,  11,  true,  true ],
  [71,  68,  2, 45,  6,   false, false],
  [91,  40,  5, 30,  21,  true,  true ],
  [14,  85,  2, 38,  10,  false, false],
  [36,  50,  3, 44,  15,  true,  true ],
  [53,  12,  2, 27,  8,   false, false],
  [67,  77,  4, 50,  18,  true,  true ],
  [82,  6,   3, 35,  23,  false, false],
  [29,  30,  2, 40,  5,   true,  false],
  [95,  60,  5, 32,  12,  false, true ],
]

export default function MuseumBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 2, transform: 'translateZ(0)' }}
      aria-hidden="true"
    >
      {/* 1 — warm gold, top-centre */}
      <div style={{
        position: 'absolute', width: '80vw', height: '80vw',
        top: '-25%', left: '10%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(200,169,110,0.08) 0%, transparent 65%)',
        animation: 'museum-ambient-glow 32s ease-in-out infinite',
      }} />

      {/* 2 — stone, bottom-right */}
      <div style={{
        position: 'absolute', width: '65vw', height: '65vw',
        bottom: '-10%', right: '5%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(168,162,158,0.065) 0%, transparent 65%)',
        animation: 'museum-ambient-glow-2 40s ease-in-out infinite',
        animationDelay: '10s',
      }} />

      {/* 3 — warm amber, mid-left */}
      <div style={{
        position: 'absolute', width: '55vw', height: '55vw',
        top: '35%', left: '-8%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(245,158,11,0.05) 0%, transparent 65%)',
        animation: 'museum-ambient-glow 48s ease-in-out infinite reverse',
        animationDelay: '6s',
      }} />

      {/* 4 — crimson-rose, top-right */}
      <div style={{
        position: 'absolute', width: '50vw', height: '50vw',
        top: '-10%', right: '-5%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(180,40,40,0.04) 0%, transparent 65%)',
        animation: 'museum-ambient-glow-2 36s ease-in-out infinite',
        animationDelay: '3s',
      }} />

      {/* 5 — gold, centre */}
      <div style={{
        position: 'absolute', width: '45vw', height: '45vw',
        top: '40%', left: '28%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(200,169,110,0.05) 0%, transparent 60%)',
        animation: 'museum-ambient-glow 55s ease-in-out infinite',
        animationDelay: '18s',
      }} />

      {/* 6 — warm parchment, bottom-left */}
      <div style={{
        position: 'absolute', width: '60vw', height: '60vw',
        bottom: '-15%', left: '-5%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(220,195,140,0.06) 0%, transparent 65%)',
        animation: 'museum-ambient-glow-2 44s ease-in-out infinite reverse',
        animationDelay: '14s',
      }} />

      {/* 7 — soft stone, mid-right */}
      <div style={{
        position: 'absolute', width: '40vw', height: '40vw',
        top: '55%', right: '-5%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(180,174,168,0.05) 0%, transparent 60%)',
        animation: 'museum-ambient-glow 38s ease-in-out infinite',
        animationDelay: '22s',
      }} />

      {/* 8 — amber whisper, upper-left */}
      <div style={{
        position: 'absolute', width: '35vw', height: '35vw',
        top: '15%', left: '5%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(245,200,80,0.04) 0%, transparent 60%)',
        animation: 'museum-ambient-glow-2 50s ease-in-out infinite',
        animationDelay: '8s',
      }} />

      {/* 9 — deep gold, lower-centre */}
      <div style={{
        position: 'absolute', width: '70vw', height: '70vw',
        bottom: '5%', left: '15%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(200,169,110,0.06) 0%, transparent 65%)',
        animation: 'museum-ambient-glow 42s ease-in-out infinite',
        animationDelay: '16s',
      }} />

      {/* 10 — rose dust, centre-right */}
      <div style={{
        position: 'absolute', width: '38vw', height: '38vw',
        top: '25%', right: '10%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(210,120,80,0.04) 0%, transparent 60%)',
        animation: 'museum-ambient-glow-2 46s ease-in-out infinite reverse',
        animationDelay: '5s',
      }} />

      {/* 11 — ivory, top-centre */}
      <div style={{
        position: 'absolute', width: '55vw', height: '55vw',
        top: '-5%', left: '25%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(230,215,180,0.06) 0%, transparent 65%)',
        animation: 'museum-ambient-glow 60s ease-in-out infinite',
        animationDelay: '2s',
      }} />

      {/* 12 — muted crimson, mid-centre */}
      <div style={{
        position: 'absolute', width: '42vw', height: '42vw',
        top: '60%', left: '35%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(160,30,30,0.035) 0%, transparent 60%)',
        animation: 'museum-ambient-glow-2 52s ease-in-out infinite',
        animationDelay: '27s',
      }} />

      {/* 13 — warm stone, upper-right */}
      <div style={{
        position: 'absolute', width: '45vw', height: '45vw',
        top: '5%', right: '20%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(190,180,160,0.05) 0%, transparent 62%)',
        animation: 'museum-ambient-glow 35s ease-in-out infinite reverse',
        animationDelay: '11s',
      }} />

      {/* 14 — saffron, bottom-centre */}
      <div style={{
        position: 'absolute', width: '48vw', height: '48vw',
        bottom: '-5%', left: '30%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(240,180,60,0.04) 0%, transparent 62%)',
        animation: 'museum-ambient-glow-2 58s ease-in-out infinite',
        animationDelay: '20s',
      }} />

      {/* 15 — pearl, lower-left */}
      <div style={{
        position: 'absolute', width: '32vw', height: '32vw',
        bottom: '20%', left: '5%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(220,210,195,0.06) 0%, transparent 60%)',
        animation: 'museum-ambient-glow 43s ease-in-out infinite',
        animationDelay: '33s',
      }} />

      {/* 16 — deep gold, lower-centre */}
      <div style={{
        position: 'absolute', width: '75vw', height: '75vw',
        bottom: '-20%', left: '12%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(200,169,110,0.09) 0%, transparent 68%)',
        animation: 'museum-ambient-glow 38s ease-in-out infinite',
        animationDelay: '9s',
      }} />

      {/* 17 — rose-dust, centre-right */}
      <div style={{
        position: 'absolute', width: '62vw', height: '62vw',
        top: '30%', right: '-10%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(210,120,80,0.065) 0%, transparent 66%)',
        animation: 'museum-ambient-glow-2 54s ease-in-out infinite reverse',
        animationDelay: '4s',
      }} />

      {/* 18 — ivory/parchment, top-centre */}
      <div style={{
        position: 'absolute', width: '68vw', height: '68vw',
        top: '-15%', left: '18%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(235,220,185,0.08) 0%, transparent 68%)',
        animation: 'museum-ambient-glow 62s ease-in-out infinite',
        animationDelay: '1s',
      }} />

      {/* 19 — muted crimson, mid-centre */}
      <div style={{
        position: 'absolute', width: '58vw', height: '58vw',
        top: '45%', left: '22%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(160,30,30,0.055) 0%, transparent 65%)',
        animation: 'museum-ambient-glow-2 48s ease-in-out infinite',
        animationDelay: '25s',
      }} />

      {/* 20 — warm stone, upper-right */}
      <div style={{
        position: 'absolute', width: '65vw', height: '65vw',
        top: '-5%', right: '-8%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(190,178,158,0.07) 0%, transparent 67%)',
        animation: 'museum-ambient-glow 44s ease-in-out infinite reverse',
        animationDelay: '13s',
      }} />

      {/* 21 — saffron, bottom-centre */}
      <div style={{
        position: 'absolute', width: '70vw', height: '70vw',
        bottom: '-18%', left: '20%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(240,185,65,0.065) 0%, transparent 67%)',
        animation: 'museum-ambient-glow-2 57s ease-in-out infinite',
        animationDelay: '19s',
      }} />

      {/* 22 — pearl, lower-left large */}
      <div style={{
        position: 'absolute', width: '72vw', height: '72vw',
        bottom: '-10%', left: '-12%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(225,215,198,0.08) 0%, transparent 68%)',
        animation: 'museum-ambient-glow 50s ease-in-out infinite',
        animationDelay: '30s',
      }} />

      {/* 23 — blazing gold, full-width centred */}
      <div style={{
        position: 'absolute', width: '100vw', height: '100vw',
        top: '10%', left: '-10%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(200,169,110,0.10) 0%, transparent 65%)',
        animation: 'museum-ambient-glow 65s ease-in-out infinite',
        animationDelay: '7s',
      }} />

      {/* 24 — warm amber flood, bottom */}
      <div style={{
        position: 'absolute', width: '95vw', height: '95vw',
        bottom: '-30%', left: '2%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(245,185,60,0.09) 0%, transparent 66%)',
        animation: 'museum-ambient-glow-2 70s ease-in-out infinite reverse',
        animationDelay: '15s',
      }} />

      {/* 25 — crimson blush, right sweep */}
      <div style={{
        position: 'absolute', width: '80vw', height: '80vw',
        top: '20%', right: '-20%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(180,40,40,0.07) 0%, transparent 65%)',
        animation: 'museum-ambient-glow 55s ease-in-out infinite',
        animationDelay: '23s',
      }} />

      {/* 26 — antique white, upper sweep */}
      <div style={{
        position: 'absolute', width: '90vw', height: '90vw',
        top: '-30%', left: '5%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(235,225,200,0.09) 0%, transparent 68%)',
        animation: 'museum-ambient-glow-2 75s ease-in-out infinite',
        animationDelay: '3s',
      }} />

      {/* 27 — deep rose, lower-right */}
      <div style={{
        position: 'absolute', width: '78vw', height: '78vw',
        bottom: '-15%', right: '-15%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(200,80,60,0.06) 0%, transparent 64%)',
        animation: 'museum-ambient-glow 46s ease-in-out infinite reverse',
        animationDelay: '28s',
      }} />

      {/* 28 — stone fog, mid-left large */}
      <div style={{
        position: 'absolute', width: '85vw', height: '85vw',
        top: '30%', left: '-25%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(180,170,155,0.08) 0%, transparent 67%)',
        animation: 'museum-ambient-glow-2 68s ease-in-out infinite',
        animationDelay: '40s',
      }} />

      {/* 29 — saffron sweep, upper-left */}
      <div style={{
        position: 'absolute', width: '82vw', height: '82vw',
        top: '-10%', left: '-20%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(245,195,80,0.07) 0%, transparent 65%)',
        animation: 'museum-ambient-glow 58s ease-in-out infinite',
        animationDelay: '36s',
      }} />

      {/* 30 — gold pulse, dead centre */}
      <div style={{
        position: 'absolute', width: '60vw', height: '60vw',
        top: '35%', left: '20%', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(200,169,110,0.12) 0%, transparent 55%)',
        animation: 'museum-ambient-glow-2 42s ease-in-out infinite reverse',
        animationDelay: '17s',
      }} />

      {/* Dust particles — no will-change on children to allow GPU compositing on container */}
      {PARTICLES.map(([x, y, size, dur, delay, gold, drift], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            filter: 'blur(0.8px)',
            background: gold
              ? `rgba(200,169,110,${0.35 + (i % 4) * 0.08})`
              : `rgba(120,113,108,${0.28 + (i % 3) * 0.07})`,
            animation: `${drift ? 'museum-particle-drift' : 'museum-particle-float'} ${dur}s ease-in-out ${delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}
