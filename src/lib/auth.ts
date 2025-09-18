import type { NextRequest } from 'next/server';
import { getSession } from './firestore-service';

type AuthResult = {
  userId: string;
  companyId?: string;
  rememberMe: boolean;
  error?: string;
  status?: number;
};

/**
 * Verifies a session token by checking the database.
 * @param token The session token string.
 * @returns A promise that resolves to the auth result.
 */
export async function verifyToken(token: string | undefined): Promise<AuthResult> {
  if (!token) {
    return { error: 'Authentication token not found', status: 401 } as AuthResult;
  }
  
  try {
    const session = await getSession(token);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return { error: 'Invalid or expired token', status: 401 } as AuthResult;
    }

    return { 
        userId: session.userId, 
        companyId: session.companyId,
        rememberMe: session.rememberMe,
    };
  } catch (err) {
    console.error("Error verifying token:", err);
    return { error: 'Internal Server Error during token verification', status: 500 } as AuthResult;
  }
}

/**
 * Validates a permanent session token from a cookie by looking it up in the database.
 */
export async function validatePermanentToken(token: string): Promise<{ userId: string; companyId: string } | null> {
    try {
        const session = await getSession(token);
        if (!session || session.type !== 'permanent' || new Date(session.expiresAt) < new Date() || !session.companyId) {
            return null;
        }
        return { userId: session.userId, companyId: session.companyId };
    } catch (error) {
        console.error("Error validating permanent token:", error);
        return null;
    }
}
