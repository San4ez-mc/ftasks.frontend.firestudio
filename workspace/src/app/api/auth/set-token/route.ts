
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Receives a JWT from the client and sets it as a secure, httpOnly cookie.
 * This is the bridge between the token received from the Telegram bot
 * and the user's browser session.
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ message: 'Токен відсутній або має невірний формат.' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    
    // Set the token in a secure, httpOnly cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PROXY /api/auth/set-token] Неочікувана помилка:`, error);
    return NextResponse.json({ 
        message: 'Внутрішня помилка сервера.', 
        details: { error: errorMessage }
    }, { status: 500 });
  }
}
