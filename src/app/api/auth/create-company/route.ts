
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev').replace(/\/$/, "");

/**
 * API route to create a company and exchange a temporary token for a permanent one.
 * This acts as a secure proxy to the main backend.
 */
export async function POST(request: NextRequest) {
  console.log('[PROXY /api/auth/create-company] Отримано POST-запит від клієнта.');
  try {
    const { companyName } = await request.json();
    const tempToken = request.headers.get('Authorization')?.split(' ')[1];

    if (!tempToken || !companyName) {
      console.error('[PROXY /api/auth/create-company] Помилка: відсутній Bearer токен або назва компанії.');
      return NextResponse.json({ message: 'Відсутній тимчасовий токен або назва компанії' }, { status: 400 });
    }
    
    const backendUrl = `${API_BASE_URL}/auth/telegram/create-company-and-login`;
    console.log(`[PROXY /api/auth/create-company] Звертаюсь до зовнішнього бекенду: ${backendUrl}`);

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tempToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyName }),
    });

    console.log(`[PROXY /api/auth/create-company] Отримано відповідь від зовнішнього бекенду зі статусом: ${backendResponse.status}`);
    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      console.error('[PROXY /api/auth/create-company] Зовнішній бекенд повернув помилку:', data);
      return NextResponse.json({
        message: data.message || 'Помилка на стороні зовнішнього бекенду.',
        details: {
            proxyStep: 'response_from_external_backend',
            backendStatus: backendResponse.status,
            backendResponse: data
        }
      }, { status: backendResponse.status });
    }

    const permanentToken = data.token;
    if (!permanentToken) {
      console.error('[PROXY /api/auth/create-company] Помилка: постійний токен не отримано від бекенду.');
      return NextResponse.json({ message: 'Постійний токен не отримано від бекенду' }, { status: 500 });
    }

    console.log('[PROXY /api/auth/create-company] Успішно отримано постійний токен. Встановлюю httpOnly cookie.');
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PROXY /api/auth/create-company] Неочікувана помилка в проксі-маршруті:`, error);
    return NextResponse.json({ 
        message: 'Внутрішня помилка сервера в проксі-маршруті.', 
        details: {
             proxyStep: 'unexpected_error',
             error: errorMessage,
        }
    }, { status: 500 });
  }
}
