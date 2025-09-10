
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { handleTelegramLogin } from '@/lib/telegram-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // FIX: Added the second argument 'rememberMe' with a default of false.
    const { tempToken, error } = await handleTelegramLogin(body, false);

    if (error) {
      return NextResponse.json({ message: error }, { status: 500 });
    }

    return NextResponse.json({ tempToken });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Login route error:', error);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
