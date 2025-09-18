
'use server';
import { getDb } from './firebase-admin';

/**
 * Checks if a given user is the owner of the specified company.
 * In this application's logic, the company owner is considered the admin.
 * @param userId The ID of the user to check.
 * @param companyId The ID of the company to check against.
 * @returns True if the user is the owner of the company, false otherwise.
 */
export const isAdmin = async (userId: string, companyId: string): Promise<boolean> => {
    if (!userId || !companyId) {
        return false;
    }
    try {
        const db = getDb();
        const companyDoc = await db.collection('companies').doc(companyId).get();
        if (!companyDoc.exists) {
            return false;
        }
        // The user is an admin if their ID matches the ownerId in the company document.
        return companyDoc.data()?.ownerId === userId;
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
};
