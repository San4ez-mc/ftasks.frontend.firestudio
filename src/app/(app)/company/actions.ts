
'use server';

import type { Employee } from '@/types/company';
import type { CompanyProfile } from '@/types/company-profile';
import { 
    getAllEmployeesForCompany, 
    updateEmployeeInDb, 
    getCompanyProfileFromDb, 
    updateCompanyProfileInDb,
    createEmployeeInDb,
} from '@/lib/firestore-service';
import { getUserSession } from '@/lib/session';


export async function getEmployees(): Promise<Employee[]> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return getAllEmployeesForCompany(session.companyId);
}

export async function updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<Employee | null> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return updateEmployeeInDb(session.companyId, employeeId, updates);
}

export async function createEmployee(employeeData: Omit<Employee, 'id' | 'companyId' | 'status' | 'notes' | 'groups' | 'synonyms' | 'avatar' | 'telegramUserId'> & { positionId: string }): Promise<Employee> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");

    const newEmployeeData: Omit<Employee, 'id' | 'companyId'> = {
        ...employeeData,
        positions: [employeeData.positionId],
        telegramUserId: `manual-${Date.now()}`, // Placeholder for manually added user
        status: 'active',
        notes: 'Створено вручну',
        groups: [],
        synonyms: [],
        avatar: `https://i.pravatar.cc/150?u=${employeeData.telegramUsername}`, // Generate a consistent avatar based on username
    };

    return createEmployeeInDb(session.companyId, newEmployeeData);
}


export async function getCompanyProfile(): Promise<CompanyProfile | null> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return getCompanyProfileFromDb(session.companyId);
}

export async function updateCompanyProfile(updates: Partial<CompanyProfile>): Promise<CompanyProfile | null> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return updateCompanyProfileInDb(session.companyId, updates);
}
