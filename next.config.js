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
      {
        source: '/assets/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/assets/videos/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
