import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const handleIntl = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  // Pass current pathname down to server components/layouts
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 1. Initialize Supabase client for session validation & cookie management
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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Fetch the current user session securely
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAdminRoute = pathname.startsWith('/admin')
  const isLoginRoute = pathname === '/admin/login'

  // 2. Protect Admin Routes (Redirect unauthenticated users to login)
  if (isAdminRoute && !isLoginRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // 3. Redirect logged-in users away from the login page
  if (isLoginRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/forms'
    return NextResponse.redirect(url)
  }

  // 4. CRITICAL: If it is an admin route, stop here and return. 
  // This prevents next-intl from breaking admin URLs with 404s.
  if (isAdminRoute) {
    return supabaseResponse
  }

  // 5. For all public routes, delegate to next-intl localization middleware
  return handleIntl(request)
}

export const config = {
  matcher: [
    // Match admin and public routes, excluding static assets and internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}