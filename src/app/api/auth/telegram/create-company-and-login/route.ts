
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { createCompanyAndAddUser, deleteSession, createSession } from '@/lib/firestore-service';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const tempToken = authHeader?.split(' ')[1];
    const authResult = await verifyToken(tempToken);
    if (authResult.error) {
      return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    }
    const { userId, rememberMe } = authResult;

    if (!userId) {
      return NextResponse.json({ message: 'User ID not found in token' }, { status: 401 });
    }

    const { companyName } = await request.json();
    if (!companyName) {
      return NextResponse.json({ message: 'companyName is required' }, { status: 400 });
    }

    const { newCompanyId } = await createCompanyAndAddUser(userId, companyName);

    if (tempToken) {
        await deleteSession(tempToken);
    }
    
    const permanentSessionExpires = new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000); // 30 days or 1 day
    const permanentSession = await createSession({
        userId,
        companyId: newCompanyId,
        rememberMe: rememberMe || false,
        expiresAt: permanentSessionExpires.toISOString(),
        type: 'permanent',
    });
    
    const response = NextResponse.json({ success: true });
    
    const maxAge = (rememberMe || false) ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
    response.cookies.set('auth_token', permanentSession.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'lax',
        path: '/',
        maxAge: maxAge,
    });
    
    return response;

  } catch (error) {
    console.error('Create company error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
