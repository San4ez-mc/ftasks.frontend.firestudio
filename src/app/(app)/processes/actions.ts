
'use server';

import type { Process } from '@/types/process';
import { mockProcesses } from '@/data/process-mock';
import { getUserSession } from '@/lib/session';


// NOTE: This file has been temporarily reverted to use mock data
// to restore the default processes as requested.

let processes: Process[] = mockProcesses;

export async function getProcesses(): Promise<Process[]> {
    return Promise.resolve(processes);
}

export async function getProcess(id: string): Promise<Process | null> {
    const process = processes.find(p => p.id === id) || null;
    return Promise.resolve(process);
}

export async function createProcess(data: Omit<Process, 'id' | 'companyId'>): Promise<Process> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");

    const newProcess: Process = {
        id: `proc-${Date.now()}`,
        companyId: session.companyId,
        ...data,
    };
    processes.unshift(newProcess);
    return Promise.resolve(newProcess);
}

export async function updateProcess(id: string, updates: Partial<Process>): Promise<Process | null> {
    let updatedProcess: Process | null = null;
    processes = processes.map(p => {
        if (p.id === id) {
            updatedProcess = { ...p, ...updates };
            return updatedProcess;
        }
        return p;
    });
    return Promise.resolve(updatedProcess);
}

export async function deleteProcess(id: string): Promise<{ success: boolean }> {
    const initialLength = processes.length;
    processes = processes.filter(p => p.id !== id);
    return Promise.resolve({ success: processes.length < initialLength });
}
