
'use server';

import { 
    getAllAudits, 
    getAuditById, 
    createAuditInDb, 
    updateAuditInDb 
} from '@/lib/firestore-service';
import { continueAudit as continueAuditFlow } from '@/ai/flows/conversational-audit-flow';
import { generateWorkPlan as generateWorkPlanFlow } from '@/ai/flows/work-plan-flow';
import type { Audit, WorkPlanItem } from '@/types/audit';
import type { ConversationalAuditInput, ConversationalAuditOutput, AuditStructure } from '@/ai/types';

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
        structuredSummary: {},
        conversationHistory: [
            {
                role: 'model',
                text: 'Вітаю! Я ваш AI-асистент для проведення бізнес-аудиту. Щоб почати, розкажіть, будь ласка, чим займається ваша компанія?'
            }
        ],
        workPlan: [],
    };
    return createAuditInDb(newAuditData);
}

export async function updateAudit(id: string, updates: Partial<Audit>): Promise<Audit | null> {
    return updateAuditInDb(id, updates);
}


export async function continueAudit(input: ConversationalAuditInput): Promise<ConversationalAuditOutput> {
    // This server action is a simple wrapper around the Genkit flow.
    return continueAuditFlow(input);
}

export async function generateWorkPlan(summary: AuditStructure): Promise<WorkPlanItem[]> {
    const plan = await generateWorkPlanFlow({ structuredSummary: summary });
    // The flow now directly returns the array, so we adjust accordingly.
    return plan;
}
