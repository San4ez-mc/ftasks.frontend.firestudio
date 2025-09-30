
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev').replace(/\/$/, "");

/**
 * API route to exchange a temporary token and company selection for a permanent token.
 * This acts as a secure proxy to the main backend.
 */
export async function POST(request: NextRequest) {
  try {
    const { companyId } = await request.json();
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
         return NextResponse.json({ message: 'Відсутній Bearer токен авторизації' }, { status: 401 });
    }
    const tempToken = authHeader.split(' ')[1];

    if (!tempToken || !companyId) {
      return NextResponse.json({ message: 'Відсутній тимчасовий токен або ID компанії' }, { status: 400 });
    }

    // Forward the request to the main backend with the corrected endpoint
    const backendResponse = await fetch(`${API_BASE_URL}/api/auth/telegram_select_company.php`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tempToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyId }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      // Forward the error from the backend
      return NextResponse.json(data, { status: backendResponse.status });
    }

    const permanentToken = data.token;
    if (!permanentToken) {
      return NextResponse.json({ message: 'Постійний токен не отримано від бекенду' }, { status: 500 });
    }

    // On success, set the permanent token in a secure, httpOnly cookie
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
    console.error('API /api/auth/select-company error:', error);
    return NextResponse.json({ message: 'Внутрішня помилка сервера' }, { status: 500 });
  }
}
