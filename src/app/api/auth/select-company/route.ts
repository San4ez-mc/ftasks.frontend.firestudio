
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev').replace(/\/$/, "");

export async function POST(request: NextRequest) {
  console.log('[PROXY /api/auth/select-company] Отримано запит від клієнта.');
  
  try {
    const authHeader = request.headers.get('Authorization');
    const { companyId } = await request.json();
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[PROXY] Помилка: відсутній Bearer токен.');
      return NextResponse.json({ message: 'Bearer токен авторизації відсутній.' }, { status: 401 });
    }
    const tempToken = authHeader.split(' ')[1];

    if (!companyId) {
       console.error('[PROXY] Помилка: відсутній companyId.');
       return NextResponse.json({ message: 'ID компанії відсутній.' }, { status: 400 });
    }

    const backendUrl = `${API_BASE_URL}/api/auth/telegram_select_company.php`;
    console.log(`[PROXY] Звертаюсь до зовнішнього бекенду: ${backendUrl}`);

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tempToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyId }),
    });

    console.log(`[PROXY] Отримано відповідь від зовнішнього бекенду зі статусом: ${backendResponse.status}`);

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      console.error('[PROXY] Зовнішній бекенд повернув помилку:', data);
      // Forward the detailed error to the client
      return NextResponse.json({
        message: data.message || 'Зовнішній бекенд повернув помилку.',
        details: {
            proxyStep: 'response_from_external_backend',
            backendStatus: backendResponse.status,
            backendResponse: data
        }
      }, { status: backendResponse.status });
    }

    const permanentToken = data.token;
    if (!permanentToken) {
      console.error('[PROXY] Помилка: постійний токен не отримано від бекенду.');
      return NextResponse.json({ message: 'Постійний токен не отримано від бекенду.' }, { status: 500 });
    }
    
    console.log('[PROXY] Успішно отримано постійний токен. Встановлюю httpOnly cookie.');
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: 'auth_token',
      value: permanentToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PROXY] Неочікувана помилка в проксі-маршруті:`, error);
    return NextResponse.json({ 
        message: 'Внутрішня помилка сервера в проксі-маршруті.', 
        details: {
             proxyStep: 'unexpected_error',
             error: errorMessage,
        }
    }, { status: 500 });
  }
}
