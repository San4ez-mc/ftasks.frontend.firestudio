
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Assume a cookie `auth_token` signifies a permanent session
  const authToken = request.cookies.get('auth_token');
  const { pathname } = request.nextUrl;

  const authPaths = ['/login', '/select-company', '/auth/telegram/callback', '/create-company'];
  
  const isAuthPath = authPaths.some(path => pathname.startsWith(path));
  const isApiWebhook = pathname.startsWith('/api/telegram/webhook');

  // Allow the API webhook to be accessed publicly
  if (isApiWebhook) {
      return NextResponse.next();
  }

  // If user is not authenticated and is trying to access a protected page, redirect to login
  if (!authToken && !isAuthPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and tries to access an auth page (like login), redirect them to the home page
  if (authToken && isAuthPath) {
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
