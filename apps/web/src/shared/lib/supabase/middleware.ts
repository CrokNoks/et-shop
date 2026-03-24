import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest, response?: NextResponse) {
  let supabaseResponse = response || NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: '__session',
      },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          // Create a new response if we're starting from scratch, 
          // but if we already have one, we just apply cookies to it
          if (!response) {
            supabaseResponse = NextResponse.next({
              request,
            })
          }
          
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Using getUser to actively validate the token and prevent redirect loops
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === '/login' || pathname.endsWith('/login');

  // 1. If no user and not on a login page -> Redirect to /login
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirectResponse = NextResponse.redirect(url);
    // Copy all cookies from our current response to the redirect
    supabaseResponse.cookies.getAll().forEach(c => redirectResponse.cookies.set(c));
    return redirectResponse;
  }

  // 2. If user exists and on a login page -> Redirect to /
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach(c => redirectResponse.cookies.set(c));
    return redirectResponse;
  }

  return supabaseResponse;
}
