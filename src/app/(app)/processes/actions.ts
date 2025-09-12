
'use server';

import type { Process } from '@/types/process';
import { 
    getAllProcessesForCompany, 
    getProcessById, 
    createProcessInDb, 
    updateProcessInDb, 
    deleteProcessFromDb 
} from '@/lib/firestore-service';
import { getUserSession } from '@/lib/session';

export async function getProcesses(): Promise<Process[]> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return getAllProcessesForCompany(session.companyId);
}

export async function getProcess(id: string): Promise<Process | null> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return getProcessById(session.companyId, id);
}

export async function createProcess(data: Omit<Process, 'id'>): Promise<Process> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return createProcessInDb(session.companyId, data);
}

export async function updateProcess(id: string, updates: Partial<Process>): Promise<Process | null> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return updateProcessInDb(session.companyId, id, updates);
}

export async function deleteProcess(id: string): Promise<{ success: boolean }> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return deleteProcessFromDb(session.companyId, id);
}
