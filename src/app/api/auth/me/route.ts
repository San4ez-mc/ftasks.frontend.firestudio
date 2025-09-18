
'use server';

import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/session';
import { getUserById, getCompaniesForUser } from '@/lib/firestore-service';

export async function GET() {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const { userId } = session;

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
