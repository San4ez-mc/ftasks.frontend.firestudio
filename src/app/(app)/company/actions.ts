
'use server';

import type { Employee } from '@/types/company';
import { getAllEmployees, updateEmployeeInDb } from '@/lib/firestore-service';


export async function getEmployees(): Promise<Employee[]> {
    return getAllEmployees();
}

export async function updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<Employee | null> {
    return updateEmployeeInDb(employeeId, updates);
}
