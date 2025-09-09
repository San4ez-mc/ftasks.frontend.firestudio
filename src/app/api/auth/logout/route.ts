
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // In a real application, you would invalidate the token here,
  // for example by adding it to a blacklist in Redis.
  // For this stateless mock, we just return a success response.
  return new NextResponse(null, { status: 204 });
}
