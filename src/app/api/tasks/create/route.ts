
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev').replace(/\/$/, "");

/**
 * Proxy route to create a new task.
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const backendUrl = `${API_BASE_URL}/tasks/create`;

  try {
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[PROXY /api/tasks/create] Неочікувана помилка:`, error);
      return NextResponse.json({ 
          message: 'Внутрішня помилка сервера в проксі-маршруті.', 
          details: { error: errorMessage }
      }, { status: 500 });
  }
}
