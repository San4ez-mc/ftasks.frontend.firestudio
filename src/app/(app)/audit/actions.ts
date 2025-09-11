
'use server';

import { 
    getAllAudits, 
    getAuditById, 
    createAuditInDb, 
    updateAuditInDb 
} from '@/lib/firestore-service';
import { continueAudit } from '@/ai/flows/conversational-audit-flow';
import type { Audit } from '@/types/audit';
import type { ConversationalAuditInput, ConversationalAuditOutput } from '@/ai/types';

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
        structuredSummary: {
            companyProfile: {
                description: '',
                products: [],
                mainBusinessProcess: '',
            }
        },
        conversationHistory: [
            {
                role: 'model',
                text: 'Вітаю! Я ваш AI-асистент для проведення бізнес-аудиту. Щоб почати, розкажіть, будь ласка, чим займається ваша компанія?'
            }
        ]
    };
    return createAuditInDb(newAuditData);
}

export async function updateAudit(id: string, updates: Partial<Audit>): Promise<Audit | null> {
    return updateAuditInDb(id, updates);
}


export async function continueConversationalAudit(input: ConversationalAuditInput): Promise<ConversationalAuditOutput> {
    // This server action is a simple wrapper around the Genkit flow.
    return continueAudit(input);
}
