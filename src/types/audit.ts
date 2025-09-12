
import type { AuditStructure } from "@/ai/types";

export type ConversationTurn = {
    role: 'user' | 'model';
    text: string;
};

export type WorkPlanItem = {
    department: string;
    problem: string;
    solution: string;
    timelineMonths: number;
}

export interface Audit {
    id: string;
    companyId: string;
    createdAt: string; // ISO date string
    isCompleted: boolean;
    structuredSummary: AuditStructure;
    conversationHistory: ConversationTurn[];
    workPlan: WorkPlanItem[];
    companyDescription?: string; 
}
