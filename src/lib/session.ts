'use server';

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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
        const decoded = jwt.verify(token, PERMANENT_JWT_SECRET) as { userId: string, companyId: string };
        if (typeof decoded === 'object' && decoded.userId && decoded.companyId) {
            return { userId: decoded.userId, companyId: decoded.companyId };
        }
        return null;
    } catch (error) {
        console.error("Failed to verify session token:", error);
        return null;
    }
}
