
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const PERMANENT_JWT_SECRET = process.env.PERMANENT_JWT_SECRET;

type AuthResult = {
  userId?: string;
  companyId?: string;
  error?: string;
  status?: number;
};

export async function verifyToken(request: NextRequest, isPermanent = false): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Authorization header missing or malformed', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  const secret = isPermanent ? PERMANENT_JWT_SECRET : JWT_SECRET;

  if (!secret) {
    console.error('JWT secret is not defined in environment variables.');
    return { error: 'Server configuration error', status: 500 };
  }

  try {
    const decoded = jwt.verify(token, secret) as { userId: string, companyId?: string, iat: number, exp: number };
    return { userId: decoded.userId, companyId: decoded.companyId };
  } catch (err) {
    return { error: 'Invalid or expired token', status: 401 };
  }
}

export function createPermanentToken(userId: string, companyId: string): string {
    if (!PERMANENT_JWT_SECRET) {
      throw new Error('Permanent JWT secret is not defined in environment variables.');
    }
    return jwt.sign({ userId, companyId }, PERMANENT_JWT_SECRET, { expiresIn: '7d' });
}
