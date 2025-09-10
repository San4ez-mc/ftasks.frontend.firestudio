
'use server';

import type { Employee } from '@/types/company';
import { firestore } from '@/lib/firebase-admin';

const employeesCollection = firestore.collection('employees');

export async function getEmployees(): Promise<Employee[]> {
    const snapshot = await employeesCollection.orderBy('firstName').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
}

export async function updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<Employee | null> {
    const docRef = employeesCollection.doc(employeeId);
    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    if (!updatedDoc.exists) {
        return null;
    }
    return { id: updatedDoc.id, ...updatedDoc.data() } as Employee;
}
