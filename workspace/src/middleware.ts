import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Serve the landing page for the root route, but not for the initial loading page.
  if (pathname === '/landing') {
    return NextResponse.rewrite(new URL('/landing/index.html', request.url));
  }
  
  // The client-side InitialLoadPage now handles auth checks and redirects.
  // The middleware's only job is to let requests pass through or handle static rewrites.

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
