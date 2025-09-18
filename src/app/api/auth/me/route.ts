
'use server';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUserById, getCompaniesForUser } from '@/lib/firestore-service';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request); // Use permanent token
    if (authResult.error) {
      return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    if (!userId) {
      return NextResponse.json({ message: 'User ID not found in token' }, { status: 401 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const userCompanies = await getCompaniesForUser(userId);

    const response = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      companies: userCompanies,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
