
'use server';

import type { Employee } from '@/types/company';
import { companyEmployees as employeesDb } from '@/lib/db';

let employees: Employee[] = employeesDb;

export async function getEmployees(): Promise<Employee[]> {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    return employees;
}

export async function updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<Employee | null> {
    let updatedEmployee: Employee | null = null;
    employees = employees.map(emp => {
        if (emp.id === employeeId) {
            updatedEmployee = { ...emp, ...updates };
            return updatedEmployee;
        }
        return emp;
    });
    return updatedEmployee;
}
