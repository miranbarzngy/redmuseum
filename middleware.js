import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Allow access to login page and public routes
  if (pathname === '/admin/login' || 
      pathname === '/api/auth/callback' || 
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/') ||
      pathname === '/kurdish' ||
      pathname === '/arabic' ||
      pathname === '/' ||
      pathname === '/favicon.ico' ||
      pathname === '/sitemap.xml' ||
      pathname === '/robots.txt') {
    return NextResponse.next()
  }

  // Check if this is an admin route
  if (pathname.startsWith('/admin') && !pathname.includes('login')) {
    // Get the auth cookie
    const authCookie = request.cookies.get('sb-access-token')
    
    // If no auth cookie, redirect to login page (NOT kurdish)
    if (!authCookie || authCookie.value === 'null') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // For additional security, verify the token with Supabase server-side
    try {
      // Import Supabase server client for middleware
      const { createServerClient } = require('@supabase/ssr')
      const { createClient } = require('@supabase/supabase-js')
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Create server client for verification
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      // Verify the user server-side (more secure than just checking cookie)
      const { data: { user }, error } = await supabase.auth.getUser(authCookie.value)
      
      if (error || !user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      return NextResponse.next()
    } catch (error) {
      console.error('Middleware auth verification error:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Allow all other routes
  return NextResponse.next()
}

// Configure which paths this middleware should run on
export const config = {
  matcher: [
    '/admin/:path*',
  ],
}
