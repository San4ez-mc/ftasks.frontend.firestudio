
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
    // --- TEMPORARY DEBUGGING STEP ---
    // The call to getDb() from the middleware seems to be causing the server to crash.
    // We are temporarily disabling this check to confirm if the rest of the app works.
    // If the app works with this change, we need a new way to protect admin routes
    // that doesn't involve a DB call from the middleware.
    console.log("isAdmin check is temporarily disabled for debugging.");
    return false;

    /*
    if (!userId || !companyId) {
        return false;
    }
    try {
        const db = await getDb();
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
    */
};
