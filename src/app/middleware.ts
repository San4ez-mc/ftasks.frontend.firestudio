
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/login',
  '/select-company',
  '/create-company',
  '/auth/telegram/callback',
  '/payment/success',
  '/payment/failure',
  '/landing/index.html',
  '/landing/style.css',
  '/landing/script.js',
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Check if the route is public
  const isPublicRoute = PUBLIC_ROUTES.some(path => pathname.startsWith(path));

  // Allow access to public routes, the root landing page, and landing assets
  if (pathname === '/' || isPublicRoute) {
    // If the root path is requested, serve the landing page
    if (pathname === '/') {
        return NextResponse.rewrite(new URL('/landing/index.html', request.url));
    }
    return NextResponse.next();
  }

  // If there's no token and the user is trying to access a protected page, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If there is a token, allow access to all other application pages
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
