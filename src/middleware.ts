
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getTokenFromStorage(request: NextRequest): string | undefined {
    // In middleware, we can only access cookies, not localStorage.
    // The client-side will handle localStorage and redirect if necessary.
    // For server-rendered pages on first load, we rely on cookies if they exist.
    // This part of the logic is now primarily handled on the client.
    return request.cookies.get('auth_token')?.value;
}


export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token');
  const { pathname } = request.nextUrl;

  const isAuthPage = ['/login', '/select-company', '/create-company'].some(path => pathname.startsWith(path)) || pathname.startsWith('/auth/telegram/callback');
  const isApiAuthRoute = pathname.startsWith('/api/auth/') || pathname.startsWith('/api/telegram/webhook');

  // Allow public API routes to be accessed without authentication
  if (isApiAuthRoute) {
      return NextResponse.next();
  }

  // If user is not authenticated and is trying to access a protected page, redirect to login
  if (!authToken && !isAuthPage) {
    // Note: The primary check for localStorage token will happen on the client side.
    // This server-side check is a fallback for direct navigation to protected pages.
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and tries to access an auth page (like login), redirect them to the home page
  if (authToken && isAuthPage) {
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
