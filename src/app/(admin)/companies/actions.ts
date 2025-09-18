
'use server';

import { getDb } from '@/lib/firebase-admin';
import { getUserSession } from '@/lib/session';
import { isAdmin } from '@/lib/admin';
import type { CompanyProfile } from '@/types/company-profile';

async function checkAdmin() {
    const session = await getUserSession();
    if (!session || !(await isAdmin(session.userId, session.companyId))) {
        throw new Error("Not authorized");
    }
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
