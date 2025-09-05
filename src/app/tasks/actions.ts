
'use server';

import type { Task } from '@/types/task';

// --- MOCK DATABASE ---
// In a real application, this data would come from a database like Firestore.

let tasks: Task[] = [
    { 
        id: '1', 
        title: 'Розробити API для авторизації', 
        description: 'Створити ендпоінти для реєстрації, входу та виходу користувача. Використовувати JWT для автентифікації.',
        dueDate: new Date().toISOString().split('T')[0], 
        status: 'todo', 
        type: 'important-urgent', 
        expectedTime: 60,
        assignee: { id: 'user-1', name: 'Іван Петренко', avatar: 'https://picsum.photos/40/40?random=1' },
        reporter: { id: 'user-2', name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' },
        resultName: 'Розробити новий модуль аналітики',
    },
    { 
        id: '2', 
        title: 'Створити UI/UX для сторінки задач', 
        dueDate: new Date().toISOString().split('T')[0], 
        status: 'todo',
        type: 'important-not-urgent',
        expectedTime: 120,
        assignee: { id: 'user-2', name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' },
        reporter: { id: 'user-2', name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' }
    },
    { 
        id: '3', 
        title: 'Налаштувати інтеграцію з Telegram', 
        dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        status: 'done',
        type: 'not-important-urgent',
        expectedTime: 45,
        actualTime: 50,
        expectedResult: 'Інтеграція має бути налаштована',
        actualResult: 'Інтеграція налаштована і протестована',
        assignee: { id: 'user-2', name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' },
        reporter: { id: 'user-2', name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' },
        resultName: 'Запустити рекламну кампанію в Google Ads'
    },
    { 
        id: '4', 
        title: 'Підготувати презентацію для клієнта', 
        dueDate: new Date().toISOString().split('T')[0], 
        status: 'todo',
        type: 'not-important-not-urgent',
        expectedTime: 30,
        assignee: { id: 'user-4', name: 'Петро Іваненко', avatar: 'https://picsum.photos/40/40?random=4' },
        reporter: { id: 'user-2', name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' }
    },
    { 
        id: '5', 
        title: 'Задача від керівника', 
        description: 'Перевірити звіти за минулий місяць.',
        dueDate: new Date().toISOString().split('T')[0], 
        status: 'todo', 
        type: 'important-urgent', 
        expectedTime: 90,
        assignee: { id: 'user-2', name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' },
        reporter: { id: 'user-4', name: 'Петро Іваненко', avatar: 'https://picsum.photos/40/40?random=4' },
    },
];


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
    const dateFilteredTasks = tasks.filter(task => task.dueDate === date);

    switch(filter) {
        case 'delegated':
            return dateFilteredTasks.filter(t => t.reporter.id === userId && t.assignee.id !== userId);
        case 'subordinates':
            // In a real app, you'd have a hierarchy. For mock data, we'll treat it like 'delegated'.
            return dateFilteredTasks.filter(t => t.reporter.id === userId && t.assignee.id !== userId);
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
    const newTask: Task = {
        id: `task-${Date.now()}-${Math.random()}`,
        ...taskData,
    };
    tasks.unshift(newTask); // Add to the beginning of the array
    return newTask;
}

/**
 * Updates an existing task.
 * @param taskId - The ID of the task to update.
 * @param updates - An object with the fields to update.
 * @returns A promise that resolves to the updated task, or null if not found.
 */
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    let updatedTask: Task | null = null;
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            updatedTask = { ...task, ...updates };
            return updatedTask;
        }
        return task;
    });
    return updatedTask;
}

/**
 * Deletes a task.
 * @param taskId - The ID of the task to delete.
 * @returns A promise that resolves to an object indicating success.
 */
export async function deleteTask(taskId: string): Promise<{ success: boolean }> {
    const initialLength = tasks.length;
    tasks = tasks.filter(task => task.id !== taskId);
    return { success: tasks.length < initialLength };
}
