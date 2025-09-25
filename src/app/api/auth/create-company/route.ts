import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev/';

/**
 * API route to create a company and exchange a temporary token for a permanent one.
 * This acts as a secure proxy to the main backend.
 */
export async function POST(request: NextRequest) {
  try {
    const { tempToken, companyName } = await request.json();

    if (!tempToken || !companyName) {
      return NextResponse.json({ message: 'Missing temporary token or company name' }, { status: 400 });
    }

    const backendResponse = await fetch(`${API_BASE_URL}/auth/telegram/create-company-and-login`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tempToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyName }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    const permanentToken = data.token;
    if (!permanentToken) {
      return NextResponse.json({ message: 'Permanent token not received from backend' }, { status: 500 });
    }

    // Set the permanent token in a secure, httpOnly cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: 'auth_token',
      value: permanentToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;

  } catch (error) {
    console.error('API /api/auth/create-company error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
