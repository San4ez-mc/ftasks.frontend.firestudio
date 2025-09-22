
'use server';

/**
 * TEMPORARILY DISABLED: The isAdmin check is causing a server crash.
 * This function is now a placeholder that always returns false to prevent
 * the firebase-admin SDK from being initialized.
 * @param userId The ID of the user to check.
 * @param companyId The ID of the company to check against.
 * @returns Always returns false.
 */
export const isAdmin = async (userId: string, companyId: string): Promise<boolean> => {
    console.warn("isAdmin check is temporarily disabled for debugging purposes.");
    return false;
};
