
'use server';

import type { Template } from '@/types/template';
import { firestore } from '@/lib/firebase-admin';

const templatesCollection = firestore.collection('templates');

export async function getTemplates(): Promise<Template[]> {
    const snapshot = await templatesCollection.orderBy('name').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template));
}

export async function createTemplate(templateData: Omit<Template, 'id'>): Promise<Template> {
    const docRef = await templatesCollection.add(templateData);
    const newDoc = await docRef.get();
    return { id: newDoc.id, ...newDoc.data() } as Template;
}

export async function updateTemplate(templateId: string, updates: Partial<Template>): Promise<Template | null> {
    const docRef = templatesCollection.doc(templateId);
    await docRef.update(updates);
    const updatedDoc = await docRef.get();
     if (!updatedDoc.exists) {
        return null;
    }
    return { id: updatedDoc.id, ...updatedDoc.data() } as Template;
}

export async function deleteTemplate(templateId: string): Promise<{ success: boolean }> {
    await templatesCollection.doc(templateId).delete();
    return { success: true };
}
