
'use server';

import type { Template } from '@/types/template';
import { 
    getAllTemplatesForCompany, 
    createTemplateInDb, 
    updateTemplateInDb, 
    deleteTemplateFromDb 
} from '@/lib/firestore-service';
import { getUserSession } from '@/lib/session';

export async function getTemplates(): Promise<Template[]> {
    const session = await getUserSession();
    if (!session) {
        return [];
    }
    return getAllTemplatesForCompany(session.companyId);
}

export async function createTemplate(templateData: Omit<Template, 'id' | 'companyId'>): Promise<Template> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return createTemplateInDb(session.companyId, templateData);
}

export async function updateTemplate(templateId: string, updates: Partial<Template>): Promise<Template | null> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return updateTemplateInDb(session.companyId, templateId, updates);
}

export async function deleteTemplate(templateId: string): Promise<{ success: boolean }> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return deleteTemplateFromDb(session.companyId, templateId);
}
