
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db, users, companies, employees } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request, true); // Use permanent token
    if (authResult.error) {
      return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    // --- Database Logic (Mocked) ---
    const user = users.find(u => u.id === userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const userEmployeeEntries = employees.filter(e => e.userId === userId);
    const userCompanyIds = userEmployeeEntries.map(e => e.companyId);
    const userCompanies = companies.filter(c => userCompanyIds.includes(c.id));
    // --- End Database Logic ---

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
