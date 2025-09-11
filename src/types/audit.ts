
import type { AuditStructure } from "@/ai/types";

export type ConversationTurn = {
    role: 'user' | 'model';
    text: string;
};

export type WorkPlanItem = {
    problem: string;
    solution: string;
}

export interface Audit {
    id: string;
    createdAt: string; // ISO date string
    isCompleted: boolean;
    structuredSummary: AuditStructure;
    conversationHistory: ConversationTurn[];
    workPlan: WorkPlanItem[];
    companyDescription?: string; 
}
