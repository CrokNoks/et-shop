import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Middleware: SUPABASE_URL or SUPABASE_KEY is missing');
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Attempt to get user. This will also refresh the session and update cookies on the response.
  // The 'user' object is not directly used here, but the side effect of updating cookies is crucial.
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Middleware: Error getting user from Supabase:', error);
  } else {
    console.log('Middleware: User obtained:', user ? 'Authenticated' : 'Not Authenticated');
  }

  // If user is not authenticated AND the path is not /login, redirect to /login
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    console.log('Middleware: User not authenticated, redirecting to /login');
    const redirectUrl = new URL('/login', request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    // Ensure the cookies updated by getUser() are also present in the redirect response
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  // If user is authenticated AND the path is /login, redirect to /
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    console.log('Middleware: User authenticated on /login, redirecting to /');
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}
