import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  if (isApiRoute) {
    return NextResponse.next()
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const hostname = request.headers.get('host')
  const subdomain = hostname?.split('.')[0]
  const currentUrl = request.url

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.match(/^\/(?:login|signup|reset-password)$/)

  // If user is not authenticated and trying to access a protected route
  if (!user && !isAuthPage) {
    // Keep them on the same subdomain's login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is authenticated and on an auth page
  if (user && isAuthPage) {
    const userRole = user.user_metadata.role
    let targetUrl = 'https://book.happyswims.life' // default

    if (userRole === 'admin') {
      targetUrl = 'https://admin.happyswims.life'
    } else if (userRole === 'instructor') {
      targetUrl = 'https://instructor.happyswims.life'
    }

    // Only redirect if we're not already on the target URL
    if (!currentUrl.startsWith(targetUrl)) {
      return NextResponse.redirect(targetUrl)
    }
  }

  // Handle subdomain access control
  if (user) {
    const userRole = user.user_metadata.role

    // Prevent access to wrong subdomains
    if (subdomain === 'admin' && userRole !== 'admin') {
      return NextResponse.redirect('https://book.happyswims.life')
    }

    if (subdomain === 'instructor' && userRole !== 'instructor') {
      return NextResponse.redirect('https://book.happyswims.life')
    }

    // Handle subdomain rewrites
    if (subdomain === 'admin') {
      return NextResponse.rewrite(new URL('/admin' + request.nextUrl.pathname, request.url))
    }

    if (subdomain === 'instructor') {
      return NextResponse.rewrite(new URL('/instructor' + request.nextUrl.pathname, request.url))
    }

    if (subdomain === 'book') {
      return NextResponse.rewrite(new URL('/book' + request.nextUrl.pathname, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}