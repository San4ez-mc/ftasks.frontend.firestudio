
'use server';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db, users, companies, employees } from '@/lib/db';

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

    // --- Database Logic (Mocked) ---
    const userEmployeeEntries = employees.filter(e => e.userId === userId);
    const userCompanyIds = userEmployeeEntries.map(e => e.companyId);
    const userCompanies = companies.filter(c => userCompanyIds.includes(c.id));
    // --- End Database Logic ---

    return NextResponse.json(userCompanies);

  } catch (error) {
    console.error('Get companies error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
