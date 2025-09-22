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

  // If no token, and not trying to access a protected page, redirect to login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If there IS a token, and they are trying to access an auth page (like /login),
  // we now ALLOW it to break the redirect loop. The application logic on the page
  // will handle re-authentication. Previously, this block redirected to '/', causing the loop.

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
