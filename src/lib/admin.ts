
'use server';

/**
 * THIS FILE IS DEPRECATED AND SCHEDULED FOR REMOVAL.
 * The isAdmin check caused critical server crashes due to incompatibility with the Next.js middleware runtime.
 * This functionality has been removed to restore application stability.
 */
export const isAdmin = async (userId: string, companyId: string): Promise<boolean> => {
    console.warn("isAdmin check is deprecated and should not be used.");
    return false;
};
