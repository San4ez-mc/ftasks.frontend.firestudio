
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev').replace(/\/$/, "");

/**
 * Proxy route to get the organization structure from the PHP backend.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const backendUrl = `${API_BASE_URL}/org-structure`;
  
  try {
    const backendResponse = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseBody = await backendResponse.text();
    const data = JSON.parse(responseBody);

    if (!backendResponse.ok) {
        return NextResponse.json({
            message: data.message || 'Помилка на стороні зовнішнього бекенду.',
            details: {
                proxyStep: 'response_from_external_backend',
                backendStatus: backendResponse.status,
                backendResponse: data
            }
        }, { status: backendResponse.status });
    }

    return NextResponse.json(data);
  } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[PROXY /api/org-structure] Неочікувана помилка:`, error);
      return NextResponse.json({ 
          message: 'Внутрішня помилка сервера в проксі-маршруті.', 
          details: { error: errorMessage }
      }, { status: 500 });
  }
}
