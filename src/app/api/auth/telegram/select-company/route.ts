
'use server';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, createPermanentToken } from '@/lib/auth';
import { db, employees } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if (authResult.error) {
      return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { companyId } = await request.json();
    if (!companyId) {
      return NextResponse.json({ message: 'companyId is required' }, { status: 400 });
    }

    // Fix: Ensure userId is not undefined before proceeding
    if (!userId) {
      return NextResponse.json({ message: 'User ID not found in token' }, { status: 401 });
    }

    // --- Database Logic (Mocked) ---
    const isMember = employees.some(e => e.userId === userId && e.companyId === companyId);
    if (!isMember) {
      return NextResponse.json({ message: 'User is not a member of this company' }, { status: 403 });
    }
    // --- End Database Logic ---

    const permanentToken = createPermanentToken(userId, companyId);

    return NextResponse.json({ token: permanentToken });

  } catch (error) {
    console.error('Select company error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
