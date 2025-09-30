import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev';

/**
 * API route to fetch a user's companies using a temporary token.
 * This acts as a secure server-side proxy to the main backend to avoid CORS issues.
 */
export async function GET(request: NextRequest) {
  try {
    const tempToken = request.headers.get('Authorization')?.split(' ')[1];

    if (!tempToken) {
      return NextResponse.json({ message: 'Temporary token is missing' }, { status: 401 });
    }

    // The PHP backend endpoint remains the same
    const backendResponse = await fetch(`${API_BASE_URL}/auth/telegram/companies`, {
      headers: {
        'Authorization': `Bearer ${tempToken}`,
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ message: 'Backend responded with an error' }));
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const companiesData = await backendResponse.json();
    return NextResponse.json(companiesData);

  } catch (error) {
    console.error('API proxy error for /api/auth/companies:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
