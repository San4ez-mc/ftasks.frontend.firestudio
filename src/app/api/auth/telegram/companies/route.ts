import { NextResponse } from 'next/server';

/**
 * This endpoint is deprecated. The logic has been moved to /api/auth/companies/route.ts
 * to create a more consistent API structure.
 */
export async function GET() {
  return NextResponse.json(
      { message: 'This endpoint is deprecated. Please use /api/auth/companies instead.' },
      { status: 410 } // 410 Gone
  );
}
