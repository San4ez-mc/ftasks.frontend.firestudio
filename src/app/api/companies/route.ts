
'use server';

import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/session';
import { getCompaniesForUser } from '@/lib/firestore-service';

export async function GET() {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const { userId } = session;
    
    const userCompanies = await getCompaniesForUser(userId);
    
    return NextResponse.json(userCompanies);

  } catch (error) {
    console.error('Get companies error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
