
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, createPermanentToken } from '@/lib/auth';
import { createCompanyAndAddUser } from '@/lib/firestore-service';

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

    const permanentToken = await createPermanentToken(userId, newCompanyId, rememberMe || false);
    
    const response = NextResponse.json({ success: true });
    
    // Set the cookie in the response
    const maxAge = (rememberMe || false) ? 24 * 60 * 60 : 60 * 60; // 1 day or 1 hour
    response.cookies.set('auth_token', permanentToken, {
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
