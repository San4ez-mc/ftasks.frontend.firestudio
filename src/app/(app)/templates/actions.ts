
'use server';

import type { Template } from '@/types/template';
import { templatesDb } from '@/lib/db';

let templates: Template[] = templatesDb;

export async function getTemplates(): Promise<Template[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return templates;
}

export async function createTemplate(templateData: Omit<Template, 'id'>): Promise<Template> {
    const newTemplate: Template = {
        id: `tpl-${Date.now()}`,
        ...templateData,
    };
    templates.unshift(newTemplate);
    return newTemplate;
}

export async function updateTemplate(templateId: string, updates: Partial<Template>): Promise<Template | null> {
    let updatedTemplate: Template | null = null;
    templates = templates.map(template => {
        if (template.id === templateId) {
            updatedTemplate = { ...template, ...updates };
            return updatedTemplate;
        }
        return template;
    });
    return updatedTemplate;
}

export async function deleteTemplate(templateId: string): Promise<{ success: boolean }> {
    const initialLength = templates.length;
    templates = templates.filter(t => t.id !== templateId);
    return { success: templates.length < initialLength };
}
