
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { db, users, companies, employees } from '@/lib/db'; // Mock DB

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: NextRequest) {
  if (!JWT_SECRET) {
    console.error("JWT_SECRET is not defined.");
    return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { id: telegramUserId, first_name, last_name, username } = body;

    if (!telegramUserId) {
      return NextResponse.json({ message: 'Telegram user ID is required' }, { status: 400 });
    }

    // --- Database Logic (Mocked) ---
    let user = users.find(u => u.telegramUserId === telegramUserId.toString());

    if (!user) {
      user = {
        id: `user-${Date.now()}`,
        telegramUserId: telegramUserId.toString(),
        firstName: first_name,
        lastName: last_name,
        telegramUsername: username,
      };
      users.push(user);
    }
    // --- End Database Logic ---

    // Generate a short-lived temporary token
    const tempToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '5m' });

    return NextResponse.json({ tempToken });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
