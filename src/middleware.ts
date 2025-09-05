
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Assume a cookie `auth_token` signifies a permanent session
  const authToken = request.cookies.get('auth_token');
  const { pathname } = request.nextUrl;

  const publicPaths = ['/login', '/select-company'];
  
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // If user is not authenticated and is trying to access a protected page, redirect to login
  if (!authToken && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and tries to access the login page, redirect them to the home page
  if (authToken && pathname === '/login') {
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
