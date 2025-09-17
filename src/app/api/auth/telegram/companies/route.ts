
'use server';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getCompaniesForUser } from '@/lib/firestore-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if (authResult.error) {
      return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    }
    
    const { userId } = authResult;

    if (!userId) {
      return NextResponse.json({ message: 'User ID not found in token' }, { status: 401 });
    }

    const userCompanies = await getCompaniesForUser(userId);

    return NextResponse.json(userCompanies);

  } catch (error) {
    console.error('Get companies error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
