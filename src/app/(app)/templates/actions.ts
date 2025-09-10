
'use server';

import type { Template } from '@/types/template';
import { getAllTemplates, createTemplateInDb, updateTemplateInDb, deleteTemplateFromDb } from '@/lib/firestore-service';

export async function getTemplates(): Promise<Template[]> {
    return getAllTemplates();
}

export async function createTemplate(templateData: Omit<Template, 'id'>): Promise<Template> {
    return createTemplateInDb(templateData);
}

export async function updateTemplate(templateId: string, updates: Partial<Template>): Promise<Template | null> {
    return updateTemplateInDb(templateId, updates);
}

export async function deleteTemplate(templateId: string): Promise<{ success: boolean }> {
    return deleteTemplateFromDb(templateId);
}
