
// src/lib/firestore-service.ts
'use server';

import { firestore } from '@/lib/firebase-admin';
import { resultsDb, tasksDb, templatesDb, companyEmployees as employeesDb, companies, users } from '@/lib/db';
import { mockInitialProcess } from '@/data/process-mock';
import type { Task } from '@/types/task';
import type { Result } from '@/types/result';
import type { Template } from '@/types/template';
import type { Employee } from '@/types/company';
import type { Process } from '@/types/process';
import type { Instruction } from '@/types/instruction';
import type { CompanyProfile } from '@/types/company-profile';
import type { Audit } from '@/types/audit';
import type { TelegramGroup, MessageLog } from '@/types/telegram-group';


const RESULTS_COLLECTION = 'results';
const TASKS_COLLECTION = 'tasks';
const TEMPLATES_COLLECTION = 'templates';
const EMPLOYEES_COLLECTION = 'employees';
const PROCESSES_COLLECTION = 'processes';
const INSTRUCTIONS_COLLECTION = 'instructions';
const GROUPS_COLLECTION = 'telegramGroups';
const GROUP_LINK_CODES_COLLECTION = 'groupLinkCodes';
const COMPANY_PROFILES_COLLECTION = 'company_profiles';
const AUDITS_COLLECTION = 'audits';
const TELEGRAM_LOGS_COLLECTION = 'telegramMessageLogs';


const initialInstructions: Omit<Instruction, 'id'>[] = [
  { 
    title: 'Планування в таск-трекері та робота в Telegram', 
    department: 'Загальні', 
    summary: 'Як ефективно планувати задачі та використовувати інтеграцію з Telegram.', 
    content: `<h1>Основні принципи планування</h1>
<p>Ефективне планування починається з двох ключових елементів: <strong>Результатів</strong> та <strong>Щоденних задач</strong>.</p>
<h2>1. Результати</h2>
<p><strong>Результати</strong> — це великі, стратегічні цілі (наприклад, "Запустити новий продукт" або "Збільшити продажі на 20%"). Вони мають кінцевий дедлайн і є вашими головними орієнтирами. Кожен результат можна розбити на менші <strong>підрезультати</strong> (чек-ліст), щоб відстежувати прогрес.</p>
<h2>2. Щоденні задачі</h2>
<p><strong>Задачі</strong> — це конкретні кроки, які ви виконуєте щодня для досягнення ваших результатів. Кожна задача має бути пов'язана з конкретним результатом, щоб ви завжди розуміли, як ваша щоденна робота впливає на великі цілі.</p>
<h2>3. Інтеграція з Telegram</h2>
<p>Наш Telegram-бот дозволяє вам швидко керувати задачами, не виходячи з месенджера. Ви можете:</p>
<ul>
  <li>Створювати задачі та результати (наприклад, "створи задачу підготувати звіт для Марії")</li>
  <li>Переглядати список співробітників</li>
  <li>Отримувати сповіщення про важливі події</li>
</ul>
<p>Щоб звернутися до бота в груповому чаті, використовуйте згадку через <strong>@</strong> або відповідайте на його повідомлення.</p>`, 
    accessList: [] 
  },
  { 
    title: 'Робота з організаційною структурою', 
    department: 'HR/Менеджмент', 
    summary: 'Правила та рекомендації по роботі з модулем оргструктури.', 
    content: `<h1>Ключові елементи оргструктури</h1>
<p>Оргструктура допомагає візуалізувати, хто за що відповідає у компанії. Вона складається з <strong>Відділень</strong>, <strong>Відділів</strong> та <strong>Секцій</strong>.</p>
<h2>1. Відділення</h2>
<p><strong>Відділення</strong> — це найбільші функціональні блоки компанії (наприклад, "Фінансове відділення" або "Відділення розповсюдження"). Вони представлені у вигляді колонок.</p>
<h2>2. Відділи та Секції</h2>
<p>Кожне відділення містить <strong>Відділи</strong> (картки), які можна перетягувати між колонками. У свою чергу, кожен відділ складається з <strong>Секцій</strong>, до яких ви можете додавати співробітників та призначати керівників.</p>
<h2>3. ЦКП (Цінний Кінцевий Продукт)</h2>
<p>Ключовим елементом для кожного відділу та секції є його <strong>ЦКП</strong>. Це чітко сформульований результат, за який відповідає підрозділ. Правильно визначений ЦКП є основою для постановки задач та оцінки ефективності.</p>
<p><em>Приклад:</em> ЦКП відділу продажів може бути "Укладені угоди та отримані оплати від клієнтів".</p>`, 
    accessList: [] 
  },
];

const defaultProcesses: Omit<Process, 'id'>[] = [
    mockInitialProcess,
    {
        name: 'Основний бізнес-процес',
        description: 'Від залучення клієнта до повного виконання всіх обов\'язків.',
        lanes: [],
    },
    {
        name: 'Створення фінансової звітності',
        description: 'Процес підготовки та подання щомісячної фінансової звітності.',
        lanes: [],
    }
]

const firestoreGuard = () => {
    if (!firestore) {
        throw new Error('Firestore is not initialized. Check server logs for Firebase Admin SDK initialization errors.');
    }
};

// --- Data Seeding ---
export async function seedDatabase() {
  firestoreGuard();
  const seedStatusRef = firestore.collection('internal').doc('seedStatus');
  const seedStatusDoc = await seedStatusRef.get();

  if (seedStatusDoc.exists && seedStatusDoc.data()?.seeded_v5) { // Use a new seed version flag
    return { success: true, message: 'Database already seeded.' };
  }

  const batch = firestore.batch();

  // Seed existing collections
  resultsDb.forEach(result => { batch.set(firestore.collection(RESULTS_COLLECTION).doc(result.id), result); });
  tasksDb.forEach(task => { batch.set(firestore.collection(TASKS_COLLECTION).doc(task.id), task); });
  templatesDb.forEach(template => { batch.set(firestore.collection(TEMPLATES_COLLECTION).doc(template.id), template); });
  employeesDb.forEach(employee => { batch.set(firestore.collection(EMPLOYEES_COLLECTION).doc(employee.id), employee); });

  // Seed company profile
  const companyProfile: Omit<CompanyProfile, 'id'> = {
      name: companies[0].name,
      description: 'Інноваційні рішення для вашого бізнесу.',
      adminId: users[0].id, // Default admin is the first user
  };
  batch.set(firestore.collection(COMPANY_PROFILES_COLLECTION).doc(companies[0].id), companyProfile);

  // Seed new collections
  defaultProcesses.forEach(proc => {
      const docRef = firestore.collection(PROCESSES_COLLECTION).doc();
      batch.set(docRef, proc);
  });
  
  initialInstructions.forEach(instr => {
      const docRef = firestore.collection(INSTRUCTIONS_COLLECTION).doc();
      batch.set(docRef, instr);
  });


  await batch.commit();
  await seedStatusRef.set({ seeded_v5: true });

  return { success: true, message: 'Database seeded successfully.' };
}

// --- Generic Firestore Functions ---

async function getAll<T>(collectionName: string): Promise<T[]> {
  firestoreGuard();
  await seedDatabase();
  const snapshot = await firestore.collection(collectionName).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

async function getByQuery<T>(collectionName: string, queryField: string, queryValue: string): Promise<T[]> {
  try {
    firestoreGuard();
    await seedDatabase();
    const snapshot = await firestore.collection(collectionName).where(queryField, '==', queryValue).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  } catch (error) {
    console.error(`Error in getByQuery for collection ${collectionName} where ${queryField} == ${queryValue}:`, error);
    return []; // Return empty array on failure to prevent crash
  }
}


async function getById<T>(collectionName: string, id: string): Promise<T | null> {
    firestoreGuard();
    await seedDatabase();
    const docRef = firestore.collection(collectionName).doc(id);
    const doc = await docRef.get();
    return doc.exists ? { id: doc.id, ...doc.data() } as T : null;
}


async function create<T extends { id?: string }>(collectionName: string, data: Omit<T, 'id'>): Promise<T> {
  firestoreGuard();
  const { id, ...rest } = data as any; // Firestore adds its own ID, so we exclude it if present
  const docRef = await firestore.collection(collectionName).add(rest);
  const newDoc = await docRef.get();
  return { id: newDoc.id, ...newDoc.data() } as T;
}

async function update<T>(collectionName: string, docId: string, updates: Partial<T>): Promise<T | null> {
  firestoreGuard();
  const docRef = firestore.collection(collectionName).doc(docId);
  await docRef.update(updates);
  const updatedDoc = await docRef.get();
  return updatedDoc.exists ? { id: updatedDoc.id, ...updatedDoc.data() } as T : null;
}

async function remove(collectionName: string, docId: string): Promise<{ success: boolean }> {
  firestoreGuard();
  await firestore.collection(collectionName).doc(docId).delete();
  return { success: true };
}

// --- Service-Specific Functions ---

export async function linkTelegramGroup(code: string, companyId: string): Promise<{ group: TelegramGroup, wasCreated: boolean }> {
    firestoreGuard();
    const codeRef = firestore.collection(GROUP_LINK_CODES_COLLECTION).doc(code);
    const codeDoc = await codeRef.get();

    if (!codeDoc.exists) {
        throw new Error("Невірний або застарілий код.");
    }
    
    const codeData = codeDoc.data() as { tgGroupId: string, groupTitle: string, expiresAt: { toDate: () => Date } };
    
    if (new Date() > codeData.expiresAt.toDate()) {
        await codeRef.delete();
        throw new Error("Невірний або застарілий код.");
    }

    const groupsRef = firestore.collection(GROUPS_COLLECTION);
    const existingGroupQuery = await groupsRef
        .where('tgGroupId', '==', codeData.tgGroupId)
        .where('companyId', '==', companyId)
        .limit(1)
        .get();

    await codeRef.delete(); // Delete the code now that we've used it

    if (!existingGroupQuery.empty) {
        // Group exists, update it
        const existingGroupDoc = existingGroupQuery.docs[0];
        const updatedGroup = await update<TelegramGroup>(GROUPS_COLLECTION, existingGroupDoc.id, { title: codeData.groupTitle, linkedAt: new Date().toISOString() });
        if (!updatedGroup) {
            throw new Error("Failed to update existing group.");
        }
        return { group: updatedGroup, wasCreated: false };
    } else {
        // Group is new, create it
        const newGroupData: Omit<TelegramGroup, 'id'> = {
            tgGroupId: codeData.tgGroupId,
            title: codeData.groupTitle,
            companyId: companyId,
            linkedAt: new Date().toISOString(),
        };
        const newGroup = await create<TelegramGroup>(GROUPS_COLLECTION, newGroupData);
        return { group: newGroup, wasCreated: true };
    }
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

// --- Company Profile ---
export const getCompanyProfileFromDb = (id: string) => getById<CompanyProfile>(COMPANY_PROFILES_COLLECTION, id);
export const updateCompanyProfileInDb = (id: string, updates: Partial<CompanyProfile>) => update<CompanyProfile>(COMPANY_PROFILES_COLLECTION, id, updates);


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

// --- Audits ---
export const getAllAudits = () => getAll<Audit>(AUDITS_COLLECTION);
export const getAuditById = (id: string) => getById<Audit>(AUDITS_COLLECTION, id);
export const createAuditInDb = (data: Omit<Audit, 'id'>) => create<Audit>(AUDITS_COLLECTION, data);
export const updateAuditInDb = (id: string, updates: Partial<Audit>) => update<Audit>(AUDITS_COLLECTION, id, updates);
export const deleteAuditFromDb = (id: string) => remove(AUDITS_COLLECTION, id);


// --- Telegram Groups ---
export const getAllTelegramGroups = (companyId: string) => getByQuery<TelegramGroup>(GROUPS_COLLECTION, 'companyId', companyId);
export const getTelegramGroupById = (id: string) => getById<TelegramGroup>(GROUPS_COLLECTION, id);


// --- Telegram Message Logs ---
export const createTelegramLog = (data: Omit<MessageLog, 'id'>) => create<MessageLog>(TELEGRAM_LOGS_COLLECTION, data);

export async function getTelegramLogsByGroupId(groupId: string): Promise<MessageLog[]> {
    firestoreGuard();
    await seedDatabase();
    const snapshot = await firestore.collection(TELEGRAM_LOGS_COLLECTION)
        .where('groupId', '==', groupId)
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MessageLog));
}
