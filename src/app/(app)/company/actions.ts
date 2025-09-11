
'use server';

import type { Employee } from '@/types/company';
import type { CompanyProfile } from '@/types/company-profile';
import { 
    getAllEmployees, 
    updateEmployeeInDb, 
    getCompanyProfileFromDb, 
    updateCompanyProfileInDb 
} from '@/lib/firestore-service';


export async function getEmployees(): Promise<Employee[]> {
    return getAllEmployees();
}

export async function updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<Employee | null> {
    return updateEmployeeInDb(employeeId, updates);
}

export async function getCompanyProfile(companyId: string): Promise<CompanyProfile | null> {
    return getCompanyProfileFromDb(companyId);
}

export async function updateCompanyProfile(companyId: string, updates: Partial<CompanyProfile>): Promise<CompanyProfile | null> {
    return updateCompanyProfileInDb(companyId, updates);
}
