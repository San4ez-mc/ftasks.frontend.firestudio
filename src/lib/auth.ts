
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
 * @deprecated This function directly accesses Firestore and should no longer be used for session validation.
 * Use an API call to the backend (`/api/auth/me`) instead.
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
