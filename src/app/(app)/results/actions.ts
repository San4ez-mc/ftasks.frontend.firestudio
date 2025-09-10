
'use server';

import type { Result } from '@/types/result';
import { firestore } from '@/lib/firebase-admin';

const resultsCollection = firestore.collection('results');

export async function getResults(): Promise<Result[]> {
    const snapshot = await resultsCollection.orderBy('name').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result));
}

export async function createResult(resultData: Omit<Result, 'id'>, index?: number): Promise<Result> {
    const docRef = await resultsCollection.add(resultData);
    const newDoc = await docRef.get();
    return { id: newDoc.id, ...newDoc.data() } as Result;
}

export async function updateResult(resultId: string, updates: Partial<Result>): Promise<Result | null> {
    const docRef = resultsCollection.doc(resultId);
    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    if (!updatedDoc.exists) {
        return null;
    }
    return { id: updatedDoc.id, ...updatedDoc.data() } as Result;
}

export async function deleteResult(resultId: string): Promise<{ success: boolean }> {
    await resultsCollection.doc(resultId).delete();
    return { success: true };
}
