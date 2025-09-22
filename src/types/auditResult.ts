
import type { AuditStructure } from "@/ai/types";
import type { WorkPlanItem } from "./audit";

export interface AuditResult {
    id: string;
    companyId: string;
    auditId: string; // Link back to the original audit
    createdAt: string; // ISO date string
    conductedBy: {
        userId: string;
        userName: string;
    };
    structuredSummary: AuditStructure;
    workPlan: WorkPlanItem[];
}

    