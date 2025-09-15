
'use server';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, createPermanentToken } from '@/lib/auth';
import { isUserMemberOfCompany } from '@/lib/firestore-service';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
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

    const permanentToken = createPermanentToken(userId, companyId, rememberMe || false);

    const response = NextResponse.json({ token: permanentToken, rememberMe: rememberMe || false });

    // Set the cookie in the response
    const maxAge = (rememberMe || false) ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
    response.cookies.set('auth_token', permanentToken, {
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
