
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = ['/login', '/login-tasks', '/select-company', '/create-company', '/auth/telegram/callback'].some(path => pathname.startsWith(path));
  const isPaymentPage = pathname.startsWith('/payment');
  
  // Allow access to auth pages, payment pages, and the root landing page regardless of token
  if (isAuthPage || isPaymentPage || pathname === '/') {
    return NextResponse.next();
  }

  // If there is no token and the user is trying to access any other page, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If there is a token, allow access to application pages
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - landing pages assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|landing/.*).*)',
  ],
};
