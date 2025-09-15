
'use server';

import type { Result } from '@/types/result';
import { 
    getAllResultsForCompany, 
    createResultInDb, 
    updateResultInDb, 
    deleteResultFromDb 
} from '@/lib/firestore-service';
import { getUserSession } from '@/lib/session';

export async function getResults(): Promise<Result[]> {
    const session = await getUserSession();
    if (!session) {
        return [];
    }
    return getAllResultsForCompany(session.companyId);
}

// The index parameter is a bit tricky with Firestore due to ordering. 
// For now, we'll just add to the end.
// A more robust solution would involve an 'order' field.
export async function createResult(resultData: Omit<Result, 'id'>): Promise<Result> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return createResultInDb(session.companyId, resultData);
}

export async function updateResult(resultId: string, updates: Partial<Result>): Promise<Result | null> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return updateResultInDb(session.companyId, resultId, updates);
}

export async function deleteResult(resultId: string): Promise<{ success: boolean }> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return deleteResultFromDb(session.companyId, resultId);
}
