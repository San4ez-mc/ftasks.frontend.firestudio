import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = ['/login', '/select-company', '/create-company', '/auth/telegram/callback'].some(path => pathname.startsWith(path)) || pathname.startsWith('/payment');
  const isApiAuthRoute = pathname.startsWith('/api/auth/') || pathname.startsWith('/api/telegram/webhook');

  // Allow API routes to handle their own auth, they are not protected by this middleware.
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // If there is no token and the user is not on an auth page, redirect to login.
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If there IS a token and the user tries to access an auth page (e.g., /login), redirect to the app's home page.
  if (token && isAuthPage) {
     // Exception for payment pages which can be accessed while logged in.
    if (pathname.startsWith('/payment')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // For all other cases, allow the request to proceed.
  // The actual token validation will now happen in the page layouts.
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
