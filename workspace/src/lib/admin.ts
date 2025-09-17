// This file contains constants and helpers for admin functionality.

// IMPORTANT: Replace this placeholder with the actual Firestore document ID of your admin user account.
// This is NOT your Telegram ID. You can find this in your Firebase console in the 'users' collection.
const ADMIN_USER_IDS = ['345126254'];

/**
 * Checks if a given user ID belongs to an administrator.
 * @param userId The ID of the user to check.
 * @returns True if the user is an admin, false otherwise.
 */
export const isAdmin = (userId: string): boolean => {
    return ADMIN_USER_IDS.includes(userId);
}
