'use server';

import { 
    getDivisionsForCompany, 
    getDepartmentsForCompany, 
    getAllEmployeesForCompany,
    saveOrgStructure
} from '@/lib/firestore-service';
import { getUserSession } from '@/lib/session';
import type { Department, Division, Employee } from '@/types/org-structure';

export async function getOrgStructureData(): Promise<{ divisions: Division[], departments: Department[], employees: Employee[] }> {
    const session = await getUserSession();
    if (!session) {
        throw new Error("Not authenticated");
    }

    const [divisions, departments, employees] = await Promise.all([
        getDivisionsForCompany(session.companyId),
        getDepartmentsForCompany(session.companyId),
        getAllEmployeesForCompany(session.companyId).then(emps => emps.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, avatar: e.avatar })))
    ]);

    return { divisions, departments, employees };
}


export async function saveOrgData(divisions: Division[], departments: Department[]): Promise<{ success: boolean }> {
    const session = await getUserSession();
    if (!session) {
        throw new Error("Not authenticated");
    }

    return saveOrgStructure(session.companyId, divisions, departments);
}
