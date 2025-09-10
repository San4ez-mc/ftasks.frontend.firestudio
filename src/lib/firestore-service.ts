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
    console.log('Database has already been seeded.');
    return { success: true, message: 'Database already seeded.' };
  }

  console.log('Seeding database...');
  const batch = firestore.batch();

  // Seed Results
  resultsDb.forEach(result => {
    const docRef = firestore.collection(RESULTS_COLLECTION).doc(result.id);
    batch.set(docRef, result);
  });

  // Seed Tasks
  tasksDb.forEach(task => {
    const docRef = firestore.collection(TASKS_COLLECTION).doc(task.id);
    batch.set(docRef, task);
  });
  
  // Seed Templates
  templatesDb.forEach(template => {
      const docRef = firestore.collection(TEMPLATES_COLLECTION).doc(template.id);
      batch.set(docRef, template);
  });

  // Seed Employees
  employeesDb.forEach(employee => {
      const docRef = firestore.collection(EMPLOYEES_COLLECTION).doc(employee.id);
      batch.set(docRef, employee);
  });

  await batch.commit();
  await seedStatusRef.set({ seeded: true });

  console.log('Database seeding complete.');
  return { success: true, message: 'Database seeded successfully.' };
}


// --- Generic Firestore Functions ---

async function getAll<T>(collectionName: string): Promise<T[]> {
  await seedDatabase(); // Ensure DB is seeded before any read
  const snapshot = await firestore.collection(collectionName).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

async function create<T extends { id: string }>(collectionName: string, data: Omit<T, 'id'>): Promise<T> {
  const docRef = firestore.collection(collectionName).doc();
  const newDoc = { id: docRef.id, ...data };
  await docRef.set(newDoc);
  return newDoc as T;
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

// --- Tasks Service ---
export const tasksService = {
  getAll: () => getAll<Task>(TASKS_COLLECTION),
  create: (data: Omit<Task, 'id'>) => create<Task>(TASKS_COLLECTION, data),
  update: (id: string, updates: Partial<Task>) => update<Task>(TASKS_COLLECTION, id, updates),
  delete: (id: string) => remove(TASKS_COLLECTION, id),
};

// --- Results Service ---
export const resultsService = {
  getAll: () => getAll<Result>(RESULTS_COLLECTION),
  create: (data: Omit<Result, 'id'>) => create<Result>(RESULTS_COLLECTION, data),
  update: (id: string, updates: Partial<Result>) => update<Result>(RESULTS_COLLECTION, id, updates),
  delete: (id: string) => remove(RESULTS_COLLECTION, id),
};

// --- Templates Service ---
export const templatesService = {
  getAll: () => getAll<Template>(TEMPLATES_COLLECTION),
  create: (data: Omit<Template, 'id'>) => create<Template>(TEMPLATES_COLLECTION, data),
  update: (id: string, updates: Partial<Template>) => update<Template>(TEMPLATES_COLLECTION, id, updates),
  delete: (id: string) => remove(TEMPLATES_COLLECTION, id),
};

// --- Employees Service ---
export const employeesService = {
  getAll: () => getAll<Employee>(EMPLOYEES_COLLECTION),
  update: (id: string, updates: Partial<Employee>) => update<Employee>(EMPLOYEES_COLLECTION, id, updates),
};
