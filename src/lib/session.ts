
'use server';

import { cookies } from 'next/headers';
import { getSession } from './firestore-service';

type UserSession = {
    userId: string;
    companyId: string;
};

export async function getUserSession(): Promise<UserSession | null> {
    const token = cookies().get('auth_token')?.value;
    if (!token) {
        return null;
    }

    try {
        const session = await getSession(token);
        
        // Validate the session from Firestore
        if (session && session.type === 'permanent' && new Date(session.expiresAt) > new Date() && session.companyId) {
            return { userId: session.userId, companyId: session.companyId };
        }

        return null;
    } catch (error) {
        console.error("Error validating session from Firestore:", error);
        return null;
    }
}
