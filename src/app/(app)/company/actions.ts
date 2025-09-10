
'use server';

import type { Employee } from '@/types/company';
import { employeesService } from '@/lib/firestore-service';


export async function getEmployees(): Promise<Employee[]> {
    return employeesService.getAll();
}

export async function updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<Employee | null> {
    return employeesService.update(employeeId, updates);
}
