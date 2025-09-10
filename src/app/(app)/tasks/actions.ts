
'use server';

import type { Task } from '@/types/task';
import { tasksService } from '@/lib/firestore-service';

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
    const allTasks = await tasksService.getAll();
    const dateFilteredTasks = allTasks.filter(task => task.dueDate === date);

    switch(filter) {
        case 'delegated':
            return dateFilteredTasks.filter(t => t.reporter.id === userId && t.assignee.id !== userId);
        case 'subordinates':
            // In a real app, you'd have a hierarchy. For mock data, we'll treat it like 'delegated'.
            return dateFilteredTasks.filter(t => t.reporter.id !== userId && t.assignee.id !== userId);
        case 'mine':
        default:
            return dateFilteredTasks.filter(t => t.assignee.id === userId);
    }
}

/**
 * Creates a new task.
 * @param taskData - The data for the new task, excluding the ID.
 * @returns A promise that resolves to the newly created task.
 */
export async function createTask(taskData: Omit<Task, 'id'>): Promise<Task> {
    return tasksService.create(taskData);
}

/**
 * Updates an existing task.
 * @param taskId - The ID of the task to update.
 * @param updates - An object with the fields to update.
 * @returns A promise that resolves to the updated task, or null if not found.
 */
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    return tasksService.update(taskId, updates);
}

/**
 * Deletes a task.
 * @param taskId - The ID of the task to delete.
 * @returns A promise that resolves to an object indicating success.
 */
export async function deleteTask(taskId: string): Promise<{ success: boolean }> {
    return tasksService.delete(taskId);
}
