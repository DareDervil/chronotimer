import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Optimistic check: read session from cookie only — no network call.
  // Use getUser() in Server Components/Actions for authoritative validation.
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  // Stale/invalid refresh token — clear the dead cookies so the error stops recurring
  if (sessionError) {
    await supabase.auth.signOut()
  }

  const user = sessionError ? null : (session?.user ?? null)

  const pathname = request.nextUrl.pathname
  const isAuthRoute = pathname === '/login' || pathname === '/register'
    || pathname === '/forgot-password' || pathname === '/reset-password'
  const isPublicShare = pathname.startsWith('/w/') || pathname.startsWith('/c/')
  const isGuestBuilder = pathname.startsWith('/try')
  const isProtected = !isAuthRoute && !isPublicShare && !isGuestBuilder && pathname !== '/'

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
