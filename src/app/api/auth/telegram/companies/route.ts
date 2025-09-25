// This file is deprecated. The client now calls the external backend directly
// since the CORS policy has been configured on the backend.
// This simplifies the architecture and debugging.

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { message: 'This endpoint is deprecated and should not be used.' },
    { status: 404 }
  );
}
