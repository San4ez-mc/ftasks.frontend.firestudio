
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { getUserSession } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token');
  const { pathname } = request.nextUrl;

  const isAuthPage = ['/login', '/select-company', '/create-company'].some(path => pathname.startsWith(path)) || pathname.startsWith('/auth/telegram/callback') || pathname.startsWith('/payment');
  const isApiAuthRoute = pathname.startsWith('/api/auth/') || pathname.startsWith('/api/telegram/webhook');

  // Allow public API routes and auth pages to be accessed without a token.
  if (isApiAuthRoute) {
      return NextResponse.next();
  }

  // Handle protected admin routes
  if (pathname.startsWith('/admin')) {
      const session = await getUserSession();
      if (!session || !isAdmin(session.userId)) {
          // If not an admin, redirect to the main app page.
          return NextResponse.redirect(new URL('/', request.url));
      }
      // If admin, allow access.
      return NextResponse.next();
  }
  
  // If user is not authenticated and is trying to access a protected page, redirect to login
  if (!authToken && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and tries to access an auth page (like login), redirect them to the home page
  if (authToken && isAuthPage) {
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
