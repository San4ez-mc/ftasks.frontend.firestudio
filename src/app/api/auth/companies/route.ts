import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev';

/**
 * API route to fetch a user's companies using a temporary token.
 * This acts as a secure server-side proxy to the main backend to avoid CORS issues.
 */
export async function GET(request: NextRequest) {
  console.log('[PROXY /api/auth/companies] Отримано GET-запит від клієнта.');
  try {
    const tempToken = request.headers.get('Authorization')?.split(' ')[1];

    if (!tempToken) {
      console.error('[PROXY /api/auth/companies] Помилка: Bearer токен відсутній.');
      return NextResponse.json({ message: 'Temporary token is missing' }, { status: 401 });
    }

    const backendUrl = `${API_BASE_URL}/auth/telegram/companies`;
    console.log(`[PROXY /api/auth/companies] Звертаюсь до зовнішнього бекенду: ${backendUrl}`);

    const backendResponse = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${tempToken}`,
      },
    });
    
    console.log(`[PROXY /api/auth/companies] Отримано відповідь від зовнішнього бекенду зі статусом: ${backendResponse.status}`);

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ message: 'Бекенд відповів помилкою без тіла' }));
      console.error('[PROXY /api/auth/companies] Зовнішній бекенд повернув помилку:', errorData);
      return NextResponse.json({
        message: 'Помилка на стороні зовнішнього бекенду.',
        details: {
            proxyStep: 'response_from_external_backend',
            backendStatus: backendResponse.status,
            backendResponse: errorData
        }
      }, { status: backendResponse.status });
    }

    const companiesData = await backendResponse.json();
    console.log('[PROXY /api/auth/companies] Успішно отримано дані. Відправляю клієнту.');
    return NextResponse.json(companiesData);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PROXY /api/auth/companies] Неочікувана помилка в проксі-маршруті:`, error);
    return NextResponse.json({ 
        message: 'Внутрішня помилка сервера в проксі-маршруті.', 
        details: {
             proxyStep: 'unexpected_error',
             error: errorMessage,
        }
    }, { status: 500 });
  }
}
