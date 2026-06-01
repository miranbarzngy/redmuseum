import Link from 'next/link'

export const metadata = {
  title: '404 — Page Not Found',
}

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 text-white"
      style={{ background: '#0a0a0a' }}
    >
      <div className="text-center max-w-md">
        {/* decorative line */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="block w-16 h-px rounded-full" style={{ background: 'linear-gradient(to right, transparent, #c8a96e)' }} />
          <span className="block w-2 h-2 rounded-full" style={{ background: '#c8a96e' }} />
          <span className="block w-16 h-px rounded-full" style={{ background: 'linear-gradient(to left, transparent, #c8a96e)' }} />
        </div>

        <p className="text-6xl font-black mb-4" style={{ color: '#7a0000' }}>404</p>
        <h1 className="text-xl font-semibold mb-2">Page Not Found</h1>
        <p className="text-gray-400 text-sm mb-8">
          The page you are looking for does not exist or has been moved.
        </p>

        <Link
          href="/kurdish"
          className="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
          style={{ background: '#7a0000' }}
        >
          Back to Home
        </Link>

        {/* bottom decorative line */}
        <div className="flex items-center justify-center gap-2 mt-10">
          <span className="block w-16 h-px rounded-full" style={{ background: 'linear-gradient(to right, transparent, #c8a96e)' }} />
          <span className="block w-2 h-2 rounded-full" style={{ background: '#c8a96e' }} />
          <span className="block w-16 h-px rounded-full" style={{ background: 'linear-gradient(to left, transparent, #c8a96e)' }} />
        </div>
      </div>
    </main>
  )
}
