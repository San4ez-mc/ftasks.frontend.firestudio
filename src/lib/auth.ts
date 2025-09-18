import type { NextRequest } from 'next/server';
import { getSession } from './firestore-service';

type AuthResult = {
  userId?: string;
  companyId?: string;
  rememberMe?: boolean;
  error?: string;
  status?: number;
};

/**
 * Verifies a temporary session token by checking the database.
 */
export async function verifyToken(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return { error: 'Authentication token not found', status: 401 };
  }
  
  try {
    const session = await getSession(token);

    if (!session || session.type !== 'temp' || new Date(session.expiresAt) < new Date()) {
      return { error: 'Invalid or expired token', status: 401 };
    }

    return { userId: session.userId, rememberMe: session.rememberMe };
  } catch (err) {
    console.error("Error verifying temp token:", err);
    return { error: 'Internal Server Error during token verification', status: 500 };
  }
}

/**
 * Validates a permanent session token from a cookie.
 */
export async function validatePermanentToken(token: string): Promise<{ userId: string; companyId: string } | null> {
    try {
        const session = await getSession(token);
        if (!session || session.type !== 'permanent' || new Date(session.expiresAt) < new Date() || !session.companyId) {
            return null;
        }
        return { userId: session.userId, companyId: session.companyId };
    } catch (error) {
        return null;
    }
}
