import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Assume a cookie `auth_token` signifies authentication
  const authToken = request.cookies.get('auth_token');
  const { pathname } = request.nextUrl;

  // If user is not authenticated and is not on the login page, redirect them to login
  if (!authToken && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and tries to access the login page, redirect them to the home page
  if (authToken && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If user is authenticated and on root, but hasn't selected a company, redirect to company selection
  // This is a simplified check. A real app might check a claim in the auth token.
  const selectedCompany = localStorage.getItem('selectedCompany'); // This won't work in middleware
  // The logic for company selection redirect should be handled client-side after login for this mock.
  // Middleware cannot access localStorage.

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
