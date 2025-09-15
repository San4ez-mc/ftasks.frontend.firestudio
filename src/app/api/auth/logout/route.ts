
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // In a real application, you might also invalidate the session/token on the server-side
  // (e.g., add it to a denylist in your database).

  const response = new NextResponse(null, { status: 204 }); // Use 204 for No Content

  // Instruct the browser to delete the auth_token cookie by setting its maxAge to 0.
  response.cookies.set({
    name: 'auth_token',
    value: '',
    path: '/',
    httpOnly: true,
    maxAge: 0,
  });

  return response;
}
