/** @type {import('next').NextConfig} */
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
              "connect-src 'self' https://bjuxbgoilihbtnifbihv.supabase.co wss://bjuxbgoilihbtnifbihv.supabase.co",
              "frame-ancestors 'self'",
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

module.exports = nextConfig
