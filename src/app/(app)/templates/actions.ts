
'use server';

import type { Template } from '@/types/template';
import { templatesService } from '@/lib/firestore-service';

export async function getTemplates(): Promise<Template[]> {
    return templatesService.getAll();
}

export async function createTemplate(templateData: Omit<Template, 'id'>): Promise<Template> {
    return templatesService.create(templateData);
}

export async function updateTemplate(templateId: string, updates: Partial<Template>): Promise<Template | null> {
    return templatesService.update(templateId, updates);
}

export async function deleteTemplate(templateId: string): Promise<{ success: boolean }> {
    return templatesService.delete(templateId);
}
