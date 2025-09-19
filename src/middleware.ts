
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validatePermanentToken } from '@/lib/auth';
import { getUserById } from '@/lib/firestore-service';

export async function middleware(request: NextRequest) {
  const tokenCookie = request.cookies.get('auth_token');
  const token = tokenCookie?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = ['/login', '/select-company', '/create-company'].some(path => pathname.startsWith(path)) || pathname.startsWith('/auth/telegram/callback') || pathname.startsWith('/payment');
  const isApiAuthRoute = pathname.startsWith('/api/auth/') || pathname.startsWith('/api/telegram/webhook');
  
  const session = token ? await validatePermanentToken(token) : null;
  let isSessionValid = false;

  if (session) {
    // Session is structurally valid, now check if the user exists in the DB.
    // This prevents a "ghost session" where the token is valid but the user has been deleted.
    const user = await getUserById(session.userId);
    if (user) {
      isSessionValid = true;
    }
  }

  // Allow public API routes to be accessed without a token.
  if (isApiAuthRoute) {
      return NextResponse.next();
  }

  // Handle protected admin routes - REMOVED the DB call from here.
  // The protection is now handled in the AdminLayout server component.
  if (pathname.startsWith('/admin')) {
      if (!isSessionValid) {
          return NextResponse.redirect(new URL('/login', request.url));
      }
  }
  
  // If session is invalid and is trying to access a protected page, redirect to login
  if (!isSessionValid && !isAuthPage) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Clear the invalid cookie so the user doesn't get stuck in a redirect loop.
    response.cookies.delete('auth_token');
    return response;
  }

  // If user has a valid session and tries to access an auth page, redirect them to the home page
  if (isSessionValid && isAuthPage) {
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
