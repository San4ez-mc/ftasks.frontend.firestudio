
// src/lib/firestore-service.ts
'use server';

import { firestore } from '@/lib/firebase-admin';
import { resultsDb, tasksDb, templatesDb, companyEmployees as employeesDb } from '@/lib/db';
import { mockInitialProcess } from '@/data/process-mock';
import type { Task } from '@/types/task';
import type { Result } from '@/types/result';
import type { Template } from '@/types/template';
import type { Employee } from '@/types/company';
import type { Process } from '@/types/process';
import type { Instruction } from '@/types/instruction';

const RESULTS_COLLECTION = 'results';
const TASKS_COLLECTION = 'tasks';
const TEMPLATES_COLLECTION = 'templates';
const EMPLOYEES_COLLECTION = 'employees';
const PROCESSES_COLLECTION = 'processes';
const INSTRUCTIONS_COLLECTION = 'instructions';
const GROUPS_COLLECTION = 'telegramGroups';
const GROUP_LINK_CODES_COLLECTION = 'groupLinkCodes';

const initialInstructions: Omit<Instruction, 'id'>[] = [
  { title: 'Як користуватися CRM', department: 'Відділ продажів', summary: 'Загальні правила та процедури роботи з клієнтською базою.', content: '<h1>Загальні правила</h1><p>Завжди заповнюйте всі поля...</p>', accessList: [] },
  { title: 'Процес онбордингу', department: 'HR', summary: 'Кроки для успішної адаптації нового співробітника.', content: '', accessList: [] },
  { title: 'Політика відпусток', department: 'Загальні', summary: 'Правила подання та затвердження заяв на відпустку.', content: '', accessList: [] },
];

// --- Data Seeding ---
export async function seedDatabase() {
  const seedStatusRef = firestore.collection('internal').doc('seedStatus');
  const seedStatusDoc = await seedStatusRef.get();

  if (seedStatusDoc.exists && seedStatusDoc.data()?.seeded_v2) { // Use a new seed version flag
    return { success: true, message: 'Database already seeded.' };
  }

  const batch = firestore.batch();

  // Seed existing collections
  resultsDb.forEach(result => { batch.set(firestore.collection(RESULTS_COLLECTION).doc(result.id), result); });
  tasksDb.forEach(task => { batch.set(firestore.collection(TASKS_COLLECTION).doc(task.id), task); });
  templatesDb.forEach(template => { batch.set(firestore.collection(TEMPLATES_COLLECTION).doc(template.id), template); });
  employeesDb.forEach(employee => { batch.set(firestore.collection(EMPLOYEES_COLLECTION).doc(employee.id), employee); });

  // Seed new collections
  const processRef = firestore.collection(PROCESSES_COLLECTION).doc(mockInitialProcess.id);
  batch.set(processRef, mockInitialProcess);
  
  initialInstructions.forEach(instr => {
      const docRef = firestore.collection(INSTRUCTIONS_COLLECTION).doc();
      batch.set(docRef, instr);
  });


  await batch.commit();
  await seedStatusRef.set({ seeded_v2: true });

  return { success: true, message: 'Database seeded successfully.' };
}

// --- Generic Firestore Functions ---

async function getAll<T>(collectionName: string): Promise<T[]> {
  await seedDatabase();
  const snapshot = await firestore.collection(collectionName).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

async function getById<T>(collectionName: string, id: string): Promise<T | null> {
    await seedDatabase();
    const docRef = firestore.collection(collectionName).doc(id);
    const doc = await docRef.get();
    return doc.exists ? { id: doc.id, ...doc.data() } as T : null;
}


async function create<T extends { id?: string }>(collectionName: string, data: Omit<T, 'id'>): Promise<T> {
  const { id, ...rest } = data as any; // Firestore adds its own ID, so we exclude it if present
  const docRef = await firestore.collection(collectionName).add(rest);
  const newDoc = await docRef.get();
  return { id: newDoc.id, ...newDoc.data() } as T;
}

async function update<T>(collectionName: string, docId: string, updates: Partial<T>): Promise<T | null> {
  const docRef = firestore.collection(collectionName).doc(docId);
  await docRef.update(updates);
  const updatedDoc = await docRef.get();
  return updatedDoc.exists ? { id: updatedDoc.id, ...updatedDoc.data() } as T : null;
}

async function remove(collectionName: string, docId: string): Promise<{ success: boolean }> {
  await firestore.collection(collectionName).doc(docId).delete();
  return { success: true };
}

// --- Service-Specific Functions ---

export async function linkTelegramGroup(code: string, companyId: string) {
    const codeRef = firestore.collection(GROUP_LINK_CODES_COLLECTION).doc(code);
    const codeDoc = await codeRef.get();

    if (!codeDoc.exists) {
        throw new Error("Invalid or expired code.");
    }
    
    const codeData = codeDoc.data() as { groupId: string, groupTitle: string, expiresAt: { toDate: () => Date } };
    
    if (new Date() > codeData.expiresAt.toDate()) {
        await codeRef.delete();
        throw new Error("Invalid or expired code.");
    }

    const groupData = {
        tgGroupId: codeData.groupId,
        title: codeData.groupTitle,
        companyId: companyId,
        linkedAt: new Date(),
    };
    
    await firestore.collection(GROUPS_COLLECTION).add(groupData);
    await codeRef.delete();
    return groupData;
}


// --- Tasks ---
export const getAllTasks = () => getAll<Task>(TASKS_COLLECTION);
export const createTaskInDb = (data: Omit<Task, 'id'>) => create<Task>(TASKS_COLLECTION, data);
export const updateTaskInDb = (id: string, updates: Partial<Task>) => update<Task>(TASKS_COLLECTION, id, updates);
export const deleteTaskFromDb = (id: string) => remove(TASKS_COLLECTION, id);

// --- Results ---
export const getAllResults = () => getAll<Result>(RESULTS_COLLECTION);
export const createResultInDb = (data: Omit<Result, 'id'>) => create<Result>(RESULTS_COLLECTION, data);
export const updateResultInDb = (id: string, updates: Partial<Result>) => update<Result>(RESULTS_COLLECTION, id, updates);
export const deleteResultFromDb = (id: string) => remove(RESULTS_COLLECTION, id);

// --- Templates ---
export const getAllTemplates = () => getAll<Template>(TEMPLATES_COLLECTION);
export const createTemplateInDb = (data: Omit<Template, 'id'>) => create<Template>(TEMPLATES_COLLECTION, data);
export const updateTemplateInDb = (id: string, updates: Partial<Template>) => update<Template>(TEMPLATES_COLLECTION, id, updates);
export const deleteTemplateFromDb = (id: string) => remove(TEMPLATES_COLLECTION, id);

// --- Employees ---
export const getAllEmployees = () => getAll<Employee>(EMPLOYEES_COLLECTION);
export const updateEmployeeInDb = (id: string, updates: Partial<Employee>) => update<Employee>(EMPLOYEES_COLLECTION, id, updates);

// --- Processes ---
export const getAllProcesses = () => getAll<Process>(PROCESSES_COLLECTION);
export const getProcessById = (id: string) => getById<Process>(PROCESSES_COLLECTION, id);
export const createProcessInDb = (data: Omit<Process, 'id'>) => create<Process>(PROCESSES_COLLECTION, data);
export const updateProcessInDb = (id: string, updates: Partial<Process>) => update<Process>(PROCESSES_COLLECTION, id, updates);
export const deleteProcessFromDb = (id: string) => remove(PROCESSES_COLLECTION, id);

// --- Instructions ---
export const getAllInstructions = () => getAll<Instruction>(INSTRUCTIONS_COLLECTION);
export const getInstructionById = (id: string) => getById<Instruction>(INSTRUCTIONS_COLLECTION, id);
export const createInstructionInDb = (data: Omit<Instruction, 'id'>) => create<Instruction>(INSTRUCTIONS_COLLECTION, data);
export const updateInstructionInDb = (id: string, updates: Partial<Instruction>) => update<Instruction>(INSTRUCTIONS_COLLECTION, id, updates);
export const deleteInstructionFromDb = (id: string) => remove(INSTRUCTIONS_COLLECTION, id);
