
'use server';

import type { Result } from '@/types/result';
import { getAllResults, createResultInDb, updateResultInDb, deleteResultFromDb } from '@/lib/firestore-service';

export async function getResults(): Promise<Result[]> {
    return getAllResults();
}

// The index parameter is a bit tricky with Firestore due to ordering. 
// For now, we'll just add to the end.
// A more robust solution would involve an 'order' field.
export async function createResult(resultData: Omit<Result, 'id'>, index?: number): Promise<Result> {
    return createResultInDb(resultData);
}

export async function updateResult(resultId: string, updates: Partial<Result>): Promise<Result | null> {
    return updateResultInDb(resultId, updates);
}

export async function deleteResult(resultId: string): Promise<{ success: boolean }> {
    return deleteResultFromDb(resultId);
}
