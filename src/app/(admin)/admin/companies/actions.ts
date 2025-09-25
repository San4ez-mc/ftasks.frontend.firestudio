
'use server';

import { getDb } from '@/lib/firebase-admin';
import { getUserSession } from '@/lib/session';
import type { CompanyProfile } from '@/types/company-profile';

async function checkAdmin() {
    // This check is now handled by the backend API and middleware.
    const session = await getUserSession();
    if (!session) {
        throw new Error("Not authorized");
    }
    // A more robust check would involve an API call to the backend to verify admin role.
    // For now, we rely on the middleware protecting the /admin routes.
}

export async function getAllCompanies(): Promise<(CompanyProfile & {userCount: number})[]> {
    await checkAdmin();
    const db = await getDb();
    const companiesSnapshot = await db.collection('company_profiles').get();
    const companies = companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompanyProfile));

    const result = await Promise.all(companies.map(async (company) => {
        const employeesSnapshot = await db.collection('employees').where('companyId', '==', company.id).get();
        return {
            ...company,
            userCount: employeesSnapshot.size,
        };
    }));

    return result;
}
