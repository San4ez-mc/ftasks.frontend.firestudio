
'use server';

import { cookies } from 'next/headers';
import { validatePermanentToken } from './auth';

type UserSession = {
    userId: string;
    companyId: string;
};

export async function getUserSession(): Promise<UserSession | null> {
    const token = cookies().get('auth_token')?.value;
    if (!token) {
        return null;
    }
    // This function now handles the full DB validation.
    return validatePermanentToken(token);
}
