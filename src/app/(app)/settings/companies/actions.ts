
'use server';

import { getUserSession } from '@/lib/session';
import { getCompaniesForUser, removeEmployeeLink } from '@/lib/firestore-service';

export async function getJoinedCompanies(): Promise<{id: string, name: string}[]> {
    const session = await getUserSession();
    if (!session) {
        console.error("No user session found for getJoinedCompanies");
        return [];
    }
    return getCompaniesForUser(session.userId);
}

export async function leaveCompany(companyId: string): Promise<{ success: boolean; message: string }> {
    const session = await getUserSession();
    if (!session) {
        return { success: false, message: "Не авторизовано." };
    }
    
    const result = await removeEmployeeLink(session.userId, companyId);
    return result;
}
