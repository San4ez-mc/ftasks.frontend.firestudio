
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// --- TEMPORARY WORKAROUND for deployment issue ---
// Using hardcoded secrets. This is insecure and for development/debugging only.
// TODO: Revert to process.env variables once the secret manager issue is resolved.
const JWT_SECRET = 'temporary-super-secret-key-for-dev';
const PERMANENT_JWT_SECRET = 'temporary-different-super-secret-key-for-dev';

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

  try {
    const decoded = jwt.verify(token, secret) as { userId: string, companyId?: string, iat: number, exp: number };
    return { userId: decoded.userId, companyId: decoded.companyId };
  } catch (err) {
    return { error: 'Invalid or expired token', status: 401 };
  }
}

export function createPermanentToken(userId: string, companyId: string): string {
    return jwt.sign({ userId, companyId }, PERMANENT_JWT_SECRET, { expiresIn: '7d' });
}
