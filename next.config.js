/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      // Never cache HTML page navigations — Next.js App Router uses streaming
      // responses which iOS Safari cannot clone/cache via ReadableStream.tee()
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkOnly',
      },
      // Never cache admin or API routes
      {
        urlPattern: /^\/api\/.*/i,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /^\/admin\/.*/i,
        handler: 'NetworkOnly',
      },
      // Cache CDN fonts (remixicon, google fonts) for 1 year
      {
        urlPattern: /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com)\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'cdn-fonts',
          expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      // Cache Supabase storage images for 7 days
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'supabase-images',
          expiration: { maxEntries: 120, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      // Cache local images / static assets forever (they're hashed)
      {
        urlPattern: /\.(?:png|jpg|jpeg|webp|avif|gif|svg|ico)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-images',
          expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
    ],
  },
})

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bjuxbgoilihbtnifbihv.supabase.co',
      },
    ],
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/kurdish',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      // Security headers on all routes
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'X-XSS-Protection',        value: '1; mode=block' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
              "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
              "img-src 'self' data: blob: https://bjuxbgoilihbtnifbihv.supabase.co https://flagcdn.com",
              "connect-src 'self' https://bjuxbgoilihbtnifbihv.supabase.co wss://bjuxbgoilihbtnifbihv.supabase.co https://cdnjs.cloudflare.com",
              "frame-ancestors 'self'",
              "worker-src 'self'",
            ].join('; '),
          },
        ],
      },
      // Static asset caching
      {
        source: '/assets/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/assets/videos/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000' }],
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
