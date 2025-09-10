
'use server';

import type { Result } from '@/types/result';
import { resultsService } from '@/lib/firestore-service';

export async function getResults(): Promise<Result[]> {
    return resultsService.getAll();
}

// The index parameter is a bit tricky with Firestore due to ordering. 
// For now, we'll just add to the end.
// A more robust solution would involve an 'order' field.
export async function createResult(resultData: Omit<Result, 'id'>, index?: number): Promise<Result> {
    return resultsService.create(resultData);
}

export async function updateResult(resultId: string, updates: Partial<Result>): Promise<Result | null> {
    return resultsService.update(resultId, updates);
}

export async function deleteResult(resultId: string): Promise<{ success: boolean }> {
    return resultsService.delete(resultId);
}
