
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev').replace(/\/$/, "");

/**
 * API route to exchange a temporary token and company selection for a permanent token.
 * This acts as a secure proxy to the main backend.
 */
export async function POST(request: NextRequest) {
  console.log('[PROXY /api/auth/select-company] Отримано POST-запит від клієнта.');
  
  try {
    const authHeader = request.headers.get('Authorization');
    const tempToken = authHeader?.split(' ')[1];
    
    const { companyId } = await request.json();
    
    if (!tempToken) {
      console.error('[PROXY /api/auth/select-company] Помилка: Bearer токен відсутній.');
      return NextResponse.json({ message: 'Bearer токен авторизації відсутній.' }, { status: 401 });
    }

    if (!companyId) {
       console.error('[PROXY /api/auth/select-company] Помилка: відсутній companyId.');
       return NextResponse.json({ message: 'ID компанії відсутній.' }, { status: 400 });
    }

    const backendUrl = `${API_BASE_URL}/api/auth/telegram_select_company.php`;
    console.log(`[PROXY /api/auth/select-company] Звертаюсь до зовнішнього бекенду: ${backendUrl}`);

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tempToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyId }),
    });

    const responseBody = await backendResponse.text();
    console.log(`[PROXY /api/auth/select-company] Отримано відповідь від зовнішнього бекенду зі статусом: ${backendResponse.status}, Тіло: ${responseBody}`);
    
    let data;
    try {
        data = JSON.parse(responseBody);
    } catch (e) {
        console.error('[PROXY /api/auth/select-company] Не вдалося розпарсити JSON від бекенду.');
        return NextResponse.json({ 
            message: 'Відповідь від зовнішнього бекенду не є валідним JSON.',
            details: {
                proxyStep: 'backend_response_parsing',
                backendStatus: backendResponse.status,
                backendResponse: responseBody
            }
        }, { status: 502 }); // 502 Bad Gateway
    }

    if (!backendResponse.ok) {
      console.error('[PROXY /api/auth/select-company] Зовнішній бекенд повернув помилку:', data);
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
      console.error('[PROXY /api/auth/select-company] Помилка: постійний токен не отримано від бекенду.');
      return NextResponse.json({ message: 'Постійний токен не отримано від бекенду.' }, { status: 500 });
    }
    
    console.log('[PROXY /api/auth/select-company] Успішно отримано постійний токен. Встановлюю httpOnly cookie.');
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
    console.error(`[PROXY /api/auth/select-company] Неочікувана помилка в проксі-маршруті:`, error);
    return NextResponse.json({ 
        message: 'Внутрішня помилка сервера в проксі-маршруті.', 
        details: {
             proxyStep: 'unexpected_error',
             error: errorMessage,
        }
    }, { status: 500 });
  }
}
