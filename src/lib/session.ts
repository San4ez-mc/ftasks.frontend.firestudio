
'use server';

import { cookies } from 'next/headers';
import * as jose from 'jose';

type UserSession = {
    userId: string;
    companyId: string;
};

/**
 * Reads and decodes the JWT from the auth_token cookie.
 * IMPORTANT: This function DOES NOT verify the token against the database or backend.
 * It only decodes the payload. Actual session validation must be done by making an
 * API call to the secure backend (e.g., via /api/auth/me).
 * 
 * @returns The decoded user session from the cookie, or null if the cookie is missing or invalid.
 */
export async function getUserSession(): Promise<UserSession | null> {
    const token = cookies().get('auth_token')?.value;
    if (!token) {
        return null;
    }

    try {
        // We decode the token without verification here.
        // The actual verification happens on the backend API endpoint.
        const decoded = jose.decodeJwt(token);
        
        const userId = decoded.sub;
        const companyId = decoded.companyId as string | undefined;

        if (!userId || !companyId) {
            console.warn("Token is missing required claims (sub, companyId).");
            return null;
        }

        return { userId, companyId };
    } catch (error) {
        console.error("Failed to decode JWT:", error);
        return null;
    }
}
