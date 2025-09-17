
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { validatePermanentToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const tokenCookie = request.cookies.get('auth_token');
  const token = tokenCookie?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = ['/login', '/select-company', '/create-company'].some(path => pathname.startsWith(path)) || pathname.startsWith('/auth/telegram/callback') || pathname.startsWith('/payment');
  const isApiAuthRoute = pathname.startsWith('/api/auth/') || pathname.startsWith('/api/telegram/webhook');
  
  const session = token ? validatePermanentToken(token) : null;

  // Allow public API routes to be accessed without a token.
  if (isApiAuthRoute) {
      return NextResponse.next();
  }

  // Handle protected admin routes
  if (pathname.startsWith('/admin')) {
      if (!session || !isAdmin(session.userId)) {
          // If not an admin, redirect to the main app page.
          return NextResponse.redirect(new URL('/', request.url));
      }
      // If admin, allow access.
      return NextResponse.next();
  }
  
  // If user has no valid session and is trying to access a protected page, redirect to login
  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user has a valid session and tries to access an auth page, redirect them to the home page
  if (session && isAuthPage) {
    // Exception: allow access to payment pages even if logged in
    if(pathname.startsWith('/payment')) {
        return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
