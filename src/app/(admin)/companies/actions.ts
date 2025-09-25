
'use server';

import { getDb } from '@/lib/firebase-admin';
import { getUserSession } from '@/lib/session';
import type { CompanyProfile } from '@/types/company-profile';

async function checkAdmin() {
    const session = await getUserSession();
    if (!session) {
        throw new Error("Not authorized");
    }
    // Admin role validation should be handled by the backend API.
    // Middleware protects access to this route group.
}

export async function getAllCompanies(): Promise<(CompanyProfile & {userCount: number})[]> {
    const session = await getUserSession();
    if (!session) {
        throw new Error("Not authorized");
    }
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
