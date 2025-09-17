
'use server';

import type { Result } from '@/types/result';
import type { Task } from '@/types/task';
import {
    getAllResultsForCompany,
    createResultInDb,
    updateResultInDb,
    deleteResultFromDb,
    getResultById,
    createTaskInDb
} from '@/lib/firestore-service';
import { getUserSession } from '@/lib/session';

export async function getResults(): Promise<Result[]> {
    const session = await getUserSession();
    if (!session) {
        return [];
    }
    return getAllResultsForCompany(session.companyId);
}

export async function createResult(resultData: Omit<Result, 'id' | 'companyId'>): Promise<Result> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return createResultInDb(session.companyId, resultData);
}

export async function updateResult(resultId: string, updates: Partial<Result>): Promise<Result | null> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");

    const originalResult = await getResultById(session.companyId, resultId);
    if (!originalResult) {
        console.error(`Result with ID ${resultId} not found for company ${session.companyId}.`);
        return null;
    }
    
    const updatedResult = await updateResultInDb(session.companyId, resultId, updates);

    // Workflow: If result is marked as completed by someone other than the reporter, create a verification task.
    if (updatedResult && updates.completed === true && originalResult.assignee.id !== originalResult.reporter.id) {
        const verificationTask: Omit<Task, 'id' | 'companyId'> = {
            title: `Перевірити результат "${originalResult.name}"`,
            description: `Результат "${originalResult.name}" був відмічений як виконаний.\n\nОпис: ${originalResult.description || 'Немає'}\n\nОчікуваний результат: ${originalResult.expectedResult || 'Не вказано'}`,
            dueDate: new Date().toISOString().split('T')[0], // Today
            status: 'todo',
            type: 'important-urgent',
            expectedTime: 15,
            assignee: originalResult.reporter,
            reporter: originalResult.reporter, // Or system
            resultId: originalResult.id,
            resultName: originalResult.name,
        };
        await createTaskInDb(session.companyId, verificationTask);
    }

    return updatedResult;
}

export async function deleteResult(resultId: string): Promise<{ success: boolean }> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return deleteResultFromDb(session.companyId, resultId);
}
