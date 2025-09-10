
'use server';

import type { Result } from '@/types/result';
import { resultsDb } from '@/lib/db';

let results: Result[] = resultsDb;

export async function getResults(): Promise<Result[]> {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    return results;
}

export async function createResult(resultData: Omit<Result, 'id'>, index?: number): Promise<Result> {
    const newResult: Result = {
        id: `res-${Date.now()}`,
        ...resultData,
    };
    if (index !== undefined) {
        results.splice(index + 1, 0, newResult);
    } else {
        results.push(newResult);
    }
    return newResult;
}

export async function updateResult(resultId: string, updates: Partial<Result>): Promise<Result | null> {
    let updatedResult: Result | null = null;
    results = results.map(result => {
        if (result.id === resultId) {
            updatedResult = { ...result, ...updates };
            return updatedResult;
        }
        return result;
    });
    return updatedResult;
}

export async function deleteResult(resultId: string): Promise<{ success: boolean }> {
    const initialLength = results.length;
    results = results.filter(r => r.id !== resultId);
    return { success: results.length < initialLength };
}
