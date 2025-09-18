
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { createCompanyAndAddUser, deleteSession, createSession } from '@/lib/firestore-service';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
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

    // Invalidate the temporary session
    const tempToken = request.headers.get('Authorization')?.split(' ')[1];
    if (tempToken) {
        await deleteSession(tempToken);
    }
    
    // Create a new permanent session
    const permanentSessionExpires = new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000); // 30 days or 1 day
    const permanentSession = await createSession({
        userId,
        companyId: newCompanyId,
        rememberMe,
        expiresAt: permanentSessionExpires.toISOString(),
        type: 'permanent',
    });
    
    const response = NextResponse.json({ success: true });
    
    // Set the cookie in the response
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
