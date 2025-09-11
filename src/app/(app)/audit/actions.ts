
'use server';

import { 
    getAllAudits, 
    getAuditById, 
    createAuditInDb, 
    updateAuditInDb 
} from '@/lib/firestore-service';
import type { Audit } from '@/types/audit';

export async function getAudits(): Promise<Audit[]> {
    return getAllAudits();
}

export async function getAudit(id: string): Promise<Audit | null> {
    return getAuditById(id);
}

export async function createAudit(): Promise<Audit> {
    const newAuditData: Omit<Audit, 'id'> = {
        createdAt: new Date().toISOString(),
        isCompleted: false,
        answers: {},
        problems: [],
        summary: 'Аудит ще не розпочато.',
        currentQuestionIndex: 0,
    };
    return createAuditInDb(newAuditData);
}

export async function updateAudit(id: string, updates: Partial<Audit>): Promise<Audit | null> {
    return updateAuditInDb(id, updates);
}
