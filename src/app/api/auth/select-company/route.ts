import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev').replace(/\/$/, "");

export async function POST(request: NextRequest) {
  console.log('[PROXY /api/auth/select-company] Received request from client.');
  try {
    const authHeader = request.headers.get('Authorization');
    const tempToken = authHeader?.split(' ')[1];
    
    const { companyId } = await request.json();

    if (!tempToken || !companyId) {
      console.error('[PROXY] Aborting: tempToken or companyId is missing.');
      return NextResponse.json({ message: 'Відсутній тимчасовий токен або ID компанії' }, { status: 400 });
    }

    const backendUrl = `${API_BASE_URL}/api/auth/telegram_select_company.php`;
    console.log(`[PROXY] Forwarding request to external backend: ${backendUrl}`);

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tempToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyId }),
    });

    console.log(`[PROXY] Received response from external backend with status: ${backendResponse.status} ${backendResponse.statusText}`);

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      console.error('[PROXY] External backend returned an error:', data);
      return NextResponse.json(data, { status: backendResponse.status });
    }

    const permanentToken = data.token;
    if (!permanentToken) {
      console.error('[PROXY] Backend response is OK but permanent token is missing.');
      return NextResponse.json({ message: 'Постійний токен не отримано від бекенду' }, { status: 500 });
    }
    
    console.log('[PROXY] Successfully received permanent token. Setting httpOnly cookie and sending success response to client.');
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
    console.error(`[PROXY] An unexpected error occurred in the proxy route: ${errorMessage}`);
    return NextResponse.json({ message: 'Внутрішня помилка сервера в проксі-маршруті.', error: errorMessage }, { status: 500 });
  }
}
