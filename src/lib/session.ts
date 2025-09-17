
'use server';

import { cookies } from 'next/headers';
import * as jose from 'jose';

const PERMANENT_JWT_SECRET = process.env.PERMANENT_JWT_SECRET;

type UserSession = {
    userId: string;
    companyId: string;
};

export async function getUserSession(): Promise<UserSession | null> {
    const token = cookies().get('auth_token')?.value;
    if (!token) {
        return null;
    }

    if (!PERMANENT_JWT_SECRET) {
        console.error("PERMANENT_JWT_SECRET is not set.");
        return null;
    }

    try {
        const secretKey = new TextEncoder().encode(PERMANENT_JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secretKey);
        const decoded = payload as { userId: string, companyId: string };

        if (typeof decoded === 'object' && decoded.userId && decoded.companyId) {
            return { userId: decoded.userId, companyId: decoded.companyId };
        }
        return null;
    } catch (error) {
        console.warn("Failed to verify session token (it might be expired):", error instanceof Error ? error.message : String(error));
        return null;
    }
}
