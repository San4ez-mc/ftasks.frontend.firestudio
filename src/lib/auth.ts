
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const PERMANENT_JWT_SECRET = process.env.PERMANENT_JWT_SECRET;

type AuthResult = {
  userId?: string;
  companyId?: string;
  rememberMe?: boolean;
  error?: string;
  status?: number;
};

export async function verifyToken(request: NextRequest, isPermanent = false): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  let token: string | undefined;

  // Prefer the Authorization header (used for short-lived temp tokens)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (isPermanent) {
    // Fall back to the httpOnly cookie for permanent sessions
    token = request.cookies.get('auth_token')?.value;
  }


  if (!token) {
    return { error: 'Authentication token not found', status: 401 };
  }
  
  const secret = isPermanent ? PERMANENT_JWT_SECRET : JWT_SECRET;

  if (!secret) {
    console.error('JWT secret is not defined in environment variables.');
    return { error: 'Server configuration error', status: 500 };
  }

  try {
    const decoded = jwt.verify(token, secret) as { userId: string, companyId?: string, rememberMe?: boolean, iat: number, exp: number };
    return { userId: decoded.userId, companyId: decoded.companyId, rememberMe: decoded.rememberMe };
  } catch (err) {
    return { error: 'Invalid or expired token', status: 401 };
  }
}

export function createPermanentToken(userId: string, companyId: string, rememberMe: boolean): string {
    if (!PERMANENT_JWT_SECRET) {
      throw new Error('Permanent JWT secret is not defined in environment variables.');
    }
    const expiresIn = rememberMe ? '1d' : '1h';
    return jwt.sign({ userId, companyId, rememberMe }, PERMANENT_JWT_SECRET, { expiresIn });
}

export function validatePermanentToken(token: string): { userId: string; companyId: string } | null {
    if (!PERMANENT_JWT_SECRET) {
        console.error("PERMANENT_JWT_SECRET is not set.");
        return null;
    }

    try {
        const decoded = jwt.verify(token, PERMANENT_JWT_SECRET) as { userId: string, companyId: string };
        if (typeof decoded === 'object' && decoded.userId && decoded.companyId) {
            return { userId: decoded.userId, companyId: decoded.companyId };
        }
        return null;
    } catch (error) {
        return null; // Token is invalid or expired
    }
}
