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

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isAuthPage) {
    const userRole = user.user_metadata.role
    console.log("User Role: ",userRole)
    let redirectUrl = '/'
    
    if (userRole === 'admin') {
      return NextResponse.redirect('https://admin.happyswims.life')
    }
    
    switch (userRole) {
      case 'instructor':
        redirectUrl = 'https://instructor.happyswims.life'
        break
      case 'client':
        redirectUrl = 'https://book.happyswims.life'
        break
    }
    
    return NextResponse.redirect(redirectUrl)
  }

  const userRole = user.user_metadata.role

  if (subdomain === 'admin' && userRole !== 'admin' && request.url !== 'https://book.happyswims.life') {
    return NextResponse.redirect('https://book.happyswims.life')
  }

  if (subdomain === 'instructor' && userRole !== 'instructor' && request.url !== 'https://instructor.happyswims.life') {
    return NextResponse.redirect('https://instructor.happyswims.life')
  }

  if (subdomain === 'book' && userRole === 'client' && request.url !== 'https://book.happyswims.life') {
    return NextResponse.redirect('https://book.happyswims.life')
  }

  if (subdomain === 'admin') {
    return NextResponse.rewrite(new URL('/admin' + request.nextUrl.pathname, request.url))
  }

  if (subdomain === 'instructor') {
    return NextResponse.rewrite(new URL('/instructor' + request.nextUrl.pathname, request.url))
  }

  if (subdomain === 'book') {
    return NextResponse.rewrite(new URL('/book' + request.nextUrl.pathname, request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}