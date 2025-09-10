
'use server';

import type { Task } from '@/types/task';
import { firestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const tasksCollection = firestore.collection('tasks');

/**
 * Fetches tasks for a specific date and user filter.
 */
export async function getTasksForDate(
    date: string, 
    userId: string, 
    filter: 'mine' | 'delegated' | 'subordinates'
): Promise<Task[]> {
    let query = tasksCollection.where('dueDate', '==', date);

    switch(filter) {
        case 'delegated':
            query = query.where('reporter.id', '==', userId).where('assignee.id', '!=', userId);
            break;
        case 'subordinates':
             // In a real app, you'd have a hierarchy. For mock data, we'll check not reporter and not assignee
            query = query.where('reporter.id', '!=', userId).where('assignee.id', '!=', userId);
            break;
        case 'mine':
        default:
            query = query.where('assignee.id', '==', userId);
            break;
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
}

/**
 * Creates a new task.
 */
export async function createTask(taskData: Omit<Task, 'id'>): Promise<Task> {
    const docRef = await tasksCollection.add({
        ...taskData,
        createdAt: FieldValue.serverTimestamp(), // Add a creation timestamp
    });
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() } as Task;
}

/**
 * Updates an existing task.
 */
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    const docRef = tasksCollection.doc(taskId);
    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    if (!updatedDoc.exists) {
        return null;
    }
    return { id: updatedDoc.id, ...updatedDoc.data() } as Task;
}

/**
 * Deletes a task.
 */
export async function deleteTask(taskId: string): Promise<{ success: boolean }> {
    await tasksCollection.doc(taskId).delete();
    return { success: true };
}
