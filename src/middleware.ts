import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = ['/login', '/login-tasks', '/select-company', '/create-company', '/auth/telegram/callback', '/payment'].some(path => pathname.startsWith(path));
  const isApiAuthRoute = pathname.startsWith('/api/auth/') || pathname.startsWith('/api/telegram/webhook');

  // Allow API routes to handle their own auth
  if (isApiAuthRoute) {
    return NextResponse.next();
  }
  
  // The middleware now only checks for the *presence* of a token.
  // The actual validity of the token is checked on the client-side
  // by calling the /api/auth/me endpoint.

  // If no token, and not trying to access a protected page, redirect to login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If there IS a token, and they are trying to access an auth page (like /login),
  // redirect them to the home page to avoid confusion.
  if (token && isAuthPage) {
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
