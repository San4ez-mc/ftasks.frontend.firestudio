
'use server';

import type { Task } from '@/types/task';
import { 
    getAllTasksForCompany, 
    createTaskInDb, 
    updateTaskInDb, 
    deleteTaskFromDb 
} from '@/lib/firestore-service';
import { getUserSession } from '@/lib/session';

// --- SERVER ACTIONS ---

/**
 * Fetches tasks for a specific date and user filter.
 * @param date - The date in 'YYYY-MM-DD' format.
 * @param userId - The ID of the current user.
 * @param filter - The filter type: 'mine', 'delegated', or 'subordinates'.
 * @returns A promise that resolves to an array of tasks.
 */
export async function getTasksForDate(
    date: string, 
    userId: string, 
    filter: 'mine' | 'delegated' | 'subordinates'
): Promise<Task[]> {
    const session = await getUserSession();
    if (!session) return [];

    const allTasks = await getAllTasksForCompany(session.companyId);
    
    // Filter by date first
    const dateFilteredTasks = allTasks.filter(task => task.dueDate === date);
    
    // Then apply user-based filter
    switch(filter) {
        case 'delegated':
            return dateFilteredTasks.filter(t => t.reporter?.id === userId && t.assignee?.id !== userId);
        case 'subordinates':
            // This logic assumes a flat hierarchy for now. 
            // A real implementation would check against an org structure.
            return dateFilteredTasks.filter(t => t.reporter?.id !== userId && t.assignee?.id !== userId);
        case 'mine':
        default:
            return dateFilteredTasks.filter(t => t.assignee?.id === userId);
    }
}


/**
 * Creates a new task.
 * @param taskData - The data for the new task, excluding the ID and companyId.
 * @returns A promise that resolves to the newly created task.
 */
export async function createTask(taskData: Omit<Task, 'id' | 'companyId'>): Promise<Task> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return createTaskInDb(session.companyId, taskData);
}

/**
 * Updates an existing task.
 * @param taskId - The ID of the task to update.
 * @param updates - An object with the fields to update.
 * @returns A promise that resolves to the updated task, or null if not found.
 */
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return updateTaskInDb(session.companyId, taskId, updates);
}

/**
 * Deletes a task.
 * @param taskId - The ID of the task to delete.
 * @returns A promise that resolves to an object indicating success.
 */
export async function deleteTask(taskId: string): Promise<{ success: boolean }> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return deleteTaskFromDb(session.companyId, taskId);
}
