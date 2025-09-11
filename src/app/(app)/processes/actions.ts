
'use server';

import type { Process } from '@/types/process';
import { 
    getAllProcesses, 
    getProcessById, 
    createProcessInDb, 
    updateProcessInDb, 
    deleteProcessFromDb 
} from '@/lib/firestore-service';

export async function getProcesses(): Promise<Process[]> {
    return getAllProcesses();
}

export async function getProcess(id: string): Promise<Process | null> {
    return getProcessById(id);
}

export async function createProcess(data: Omit<Process, 'id'>): Promise<Process> {
    return createProcessInDb(data);
}

export async function updateProcess(id: string, updates: Partial<Process>): Promise<Process | null> {
    return updateProcessInDb(id, updates);
}

export async function deleteProcess(id: string): Promise<{ success: boolean }> {
    return deleteProcessFromDb(id);
}
