/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Disable image optimization
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
