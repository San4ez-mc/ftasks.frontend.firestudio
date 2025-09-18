
'use server';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { isUserMemberOfCompany, deleteSession, createSession } from '@/lib/firestore-service';

export async function POST(request: NextRequest) {
  try {
    const tempToken = request.headers.get('Authorization')?.split(' ')[1];
    const authResult = await verifyToken(tempToken);

    if (authResult.error) {
      return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    }
    const { userId, rememberMe } = authResult;

    const { companyId } = await request.json();
    if (!companyId) {
      return NextResponse.json({ message: 'companyId is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ message: 'User ID not found in token' }, { status: 401 });
    }

    const isMember = await isUserMemberOfCompany(userId, companyId);
    if (!isMember) {
      return NextResponse.json({ message: 'User is not a member of this company' }, { status: 403 });
    }
    
    if (tempToken) {
        await deleteSession(tempToken);
    }

    const permanentSessionExpires = new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000); // 30 days or 1 day
    const permanentSession = await createSession({
        userId,
        companyId,
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
    console.error('Select company error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
