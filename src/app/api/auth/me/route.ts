import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// The API base URL for your external backend.
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev').replace(/\/$/, "");

/**
 * API route to get the current user's profile.
 * This acts as a secure proxy between the client/server components and your main backend.
 * It forwards the session token from the incoming request's cookie to the main backend.
 */
export async function GET(request: NextRequest) {
  console.log('[PROXY /api/auth/me] Отримано GET-запит.');
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];

    if (!token) {
      console.error('[PROXY /api/auth/me] Помилка: auth_token cookie відсутній.');
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    const backendUrl = `${API_BASE_URL}/auth/me`;
    console.log(`[PROXY /api/auth/me] Звертаюсь до зовнішнього бекенду: ${backendUrl}`);

    // Forward the request to your main backend's /auth/me endpoint
    const backendResponse = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseBody = await backendResponse.text();
    console.log(`[PROXY /api/auth/me] Отримано відповідь від зовнішнього бекенду зі статусом: ${backendResponse.status}`);
    
    let data;
    try {
        data = JSON.parse(responseBody);
    } catch (e) {
        console.error('[PROXY /api/auth/me] Не вдалося розпарсити JSON від бекенду.');
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
      console.error('[PROXY /api/auth/me] Зовнішній бекенд повернув помилку:', data);
      return NextResponse.json({
        message: data.message || 'Помилка на стороні зовнішнього бекенду.',
        details: {
            proxyStep: 'response_from_external_backend',
            backendStatus: backendResponse.status,
            backendResponse: data
        }
      }, { status: backendResponse.status });
    }

    console.log('[PROXY /api/auth/me] Успішно отримано дані користувача. Відправляю клієнту.');
    return NextResponse.json(data);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PROXY /api/auth/me] Неочікувана помилка в проксі-маршруті:`, error);
    return NextResponse.json({ 
        message: 'Внутрішня помилка сервера в проксі-маршруті.', 
        details: {
             proxyStep: 'unexpected_error',
             error: errorMessage,
        }
    }, { status: 500 });
  }
}
