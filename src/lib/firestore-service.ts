// src/lib/firestore-service.ts
'use server';

import { firestore } from '@/lib/firebase-admin';
import { resultsDb, tasksDb, templatesDb, companyEmployees as employeesDb } from '@/lib/db';
import type { Task } from '@/types/task';
import type { Result } from '@/types/result';
import type { Template } from '@/types/template';
import type { Employee } from '@/types/company';

const RESULTS_COLLECTION = 'results';
const TASKS_COLLECTION = 'tasks';
const TEMPLATES_COLLECTION = 'templates';
const EMPLOYEES_COLLECTION = 'employees';

// --- Data Seeding ---
export async function seedDatabase() {
  const seedStatusRef = firestore.collection('internal').doc('seedStatus');
  const seedStatusDoc = await seedStatusRef.get();

  if (seedStatusDoc.exists && seedStatusDoc.data()?.seeded) {
    // console.log('Database has already been seeded.');
    return { success: true, message: 'Database already seeded.' };
  }

  // console.log('Seeding database...');
  const batch = firestore.batch();

  resultsDb.forEach(result => {
    const docRef = firestore.collection(RESULTS_COLLECTION).doc(result.id);
    batch.set(docRef, result);
  });

  tasksDb.forEach(task => {
    const docRef = firestore.collection(TASKS_COLLECTION).doc(task.id);
    batch.set(docRef, task);
  });
  
  templatesDb.forEach(template => {
      const docRef = firestore.collection(TEMPLATES_COLLECTION).doc(template.id);
      batch.set(docRef, template);
  });

  employeesDb.forEach(employee => {
      const docRef = firestore.collection(EMPLOYEES_COLLECTION).doc(employee.id);
      batch.set(docRef, employee);
  });

  await batch.commit();
  await seedStatusRef.set({ seeded: true });

  // console.log('Database seeding complete.');
  return { success: true, message: 'Database seeded successfully.' };
}

// --- Generic Firestore Functions ---

async function getAll<T>(collectionName: string): Promise<T[]> {
  await seedDatabase();
  const snapshot = await firestore.collection(collectionName).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

async function create<T extends { id: string }>(collectionName: string, data: Omit<T, 'id'>): Promise<T> {
  const docRef = firestore.collection(collectionName).doc();
  const newDocData = { ...data, id: docRef.id }; // Add id to the data object
  await docRef.set(newDocData);
  return { ...newDocData } as T; // Return the full object including id
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

// --- Tasks Service Exports ---
export async function getAllTasks(): Promise<Task[]> { return getAll<Task>(TASKS_COLLECTION); }
export async function createTaskInDb(data: Omit<Task, 'id'>): Promise<Task> { return create<Task>(TASKS_COLLECTION, data); }
export async function updateTaskInDb(id: string, updates: Partial<Task>): Promise<Task | null> { return update<Task>(TASKS_COLLECTION, id, updates); }
export async function deleteTaskFromDb(id: string): Promise<{ success: boolean }> { return remove(TASKS_COLLECTION, id); }

// --- Results Service Exports ---
export async function getAllResults(): Promise<Result[]> { return getAll<Result>(RESULTS_COLLECTION); }
export async function createResultInDb(data: Omit<Result, 'id'>): Promise<Result> { return create<Result>(RESULTS_COLLECTION, data); }
export async function updateResultInDb(id: string, updates: Partial<Result>): Promise<Result | null> { return update<Result>(RESULTS_COLLECTION, id, updates); }
export async function deleteResultFromDb(id: string): Promise<{ success: boolean }> { return remove(RESULTS_COLLECTION, id); }

// --- Templates Service Exports ---
export async function getAllTemplates(): Promise<Template[]> { return getAll<Template>(TEMPLATES_COLLECTION); }
export async function createTemplateInDb(data: Omit<Template, 'id'>): Promise<Template> { return create<Template>(TEMPLATES_COLLECTION, data); }
export async function updateTemplateInDb(id: string, updates: Partial<Template>): Promise<Template | null> { return update<Template>(TEMPLATES_COLLECTION, id, updates); }
export async function deleteTemplateFromDb(id: string): Promise<{ success: boolean }> { return remove(TEMPLATES_COLLECTION, id); }

// --- Employees Service Exports ---
export async function getAllEmployees(): Promise<Employee[]> { return getAll<Employee>(EMPLOYEES_COLLECTION); }
export async function updateEmployeeInDb(id: string, updates: Partial<Employee>): Promise<Employee | null> { return update<Employee>(EMPLOYEES_COLLECTION, id, updates); }
