
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, createPermanentToken } from '@/lib/auth';
import { db, companies, employees } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if (authResult.error) {
      return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    }
    const { userId, rememberMe } = authResult;

    // Fix: Ensure userId is not undefined before proceeding
    if (!userId) {
      return NextResponse.json({ message: 'User ID not found in token' }, { status: 401 });
    }

    const { companyName } = await request.json();
    if (!companyName) {
      return NextResponse.json({ message: 'companyName is required' }, { status: 400 });
    }

    // --- Database Logic (Mocked) ---
    const newCompany = {
      id: `company-${Date.now()}`,
      name: companyName,
      ownerId: userId,
    };
    companies.push(newCompany);

    const newEmployeeEntry = {
      id: `emp-${Date.now()}`,
      userId: userId,
      companyId: newCompany.id,
      status: 'active',
      notes: 'Company creator',
    };
    employees.push(newEmployeeEntry);
    // --- End Database Logic ---

    const permanentToken = createPermanentToken(userId, newCompany.id, rememberMe || false);
    
    return NextResponse.json({ token: permanentToken });

  } catch (error) {
    console.error('Create company error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
