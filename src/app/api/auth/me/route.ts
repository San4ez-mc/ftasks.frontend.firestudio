
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// The API base URL for your external backend.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev/';

/**
 * API route to get the current user's profile.
 * This acts as a secure proxy between the client/server components and your main backend.
 * It forwards the session token from the incoming request's cookie to the main backend.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Forward the request to your main backend's /auth/me endpoint
    const backendResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!backendResponse.ok) {
      // If the backend says the token is invalid, return its response status and body
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const userData = await backendResponse.json();
    return NextResponse.json(userData);

  } catch (error) {
    console.error('API /auth/me error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
