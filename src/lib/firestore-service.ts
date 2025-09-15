
// src/lib/firestore-service.ts
'use server';

import { firestore } from '@/lib/firebase-admin';
import type { Task } from '@/types/task';
import type { Result } from '@/types/result';
import type { Template } from '@/types/template';
import type { Employee } from '@/types/company';
import type { Process } from '@/types/process';
import type { Instruction } from '@/types/instruction';
import type { CompanyProfile } from '@/types/company-profile';
import type { Audit } from '@/types/audit';
import type { TelegramGroup, MessageLog } from '@/types/telegram-group';
import type { TelegramMember } from '@/types/telegram-member';
import type { User } from '@/types/user';


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
const TELEGRAM_MEMBERS_COLLECTION = 'telegramMembers';
const COMPANIES_COLLECTION = 'companies';
const USERS_COLLECTION = 'users';


const firestoreGuard = () => {
    if (!firestore) {
        throw new Error('Firestore is not initialized. Check server logs for Firebase Admin SDK initialization errors.');
    }
};

// --- Generic Firestore Functions ---

async function getByQuery<T>(collectionName: string, queryField: string, queryValue: string): Promise<T[]> {
  try {
    firestoreGuard();
    const snapshot = await firestore.collection(collectionName).where(queryField, '==', queryValue).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  } catch (error) {
    console.error(`Error in getByQuery for collection ${collectionName} where ${queryField} == ${queryValue}:`, error);
    return []; // Return empty array on failure to prevent crash
  }
}

async function getDocAndValidateCompany<T>(collectionName: string, id: string, companyId: string): Promise<T | null> {
    firestoreGuard();
    const docRef = firestore.collection(collectionName).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
        return null;
    }

    const data = doc.data();
    if (data?.companyId !== companyId) {
        console.warn(`Attempted to access document in ${collectionName} with ID ${id} from wrong company ${companyId}.`);
        return null; // Security: do not return doc if companyId doesn't match
    }
    
    return { id: doc.id, ...data } as T;
}

async function create<T extends { id?: string }>(collectionName: string, data: Omit<T, 'id'>): Promise<T> {
  firestoreGuard();
  const { id, ...rest } = data as any;
  const docRef = await firestore.collection(collectionName).add(rest);
  const newDoc = await docRef.get();
  return { id: newDoc.id, ...newDoc.data() } as T;
}

async function update<T>(collectionName: string, docId: string, companyId: string, updates: Partial<T>): Promise<T | null> {
  firestoreGuard();
  const doc = await getDocAndValidateCompany<T & {id: string}>(collectionName, docId, companyId);
  if (!doc) {
      return null;
  }
  
  const docRef = firestore.collection(collectionName).doc(docId);
  await docRef.update(updates);
  
  const updatedDoc = await docRef.get();
  return updatedDoc.exists ? { id: updatedDoc.id, ...updatedDoc.data() } as T : null;
}

async function remove(collectionName: string, docId: string, companyId: string): Promise<{ success: boolean }> {
  firestoreGuard();
  const doc = await getDocAndValidateCompany(collectionName, docId, companyId);
   if (!doc) {
      return { success: false }; // Or throw an error
  }
  await firestore.collection(collectionName).doc(docId).delete();
  return { success: true };
}

// --- Service-Specific Functions ---

// --- Auth Related ---
export async function findUserByTelegramId(telegramUserId: string): Promise<(User & { id: string }) | null> {
    const users = await getByQuery<User & {id: string}>(USERS_COLLECTION, 'telegramUserId', telegramUserId);
    return users[0] || null;
}
export async function getUserById(userId: string): Promise<(User & { id: string }) | null> {
    firestoreGuard();
    const doc = await firestore.collection(USERS_COLLECTION).doc(userId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as User & { id: string } : null;
}

export async function getCompaniesForUser(userId: string): Promise<{id: string, name: string}[]> {
    const employeeLinks = await getByQuery<{companyId: string}>(EMPLOYEES_COLLECTION, 'userId', userId);
    if (employeeLinks.length === 0) return [];

    const companyIds = employeeLinks.map(link => link.companyId);
    
    firestoreGuard();
    const companiesSnapshot = await firestore.collection(COMPANIES_COLLECTION).where(firestore.FieldPath.documentId(), 'in', companyIds).get();
    
    return companiesSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
}

export async function isUserMemberOfCompany(userId: string, companyId: string): Promise<boolean> {
    firestoreGuard();
    const snapshot = await firestore.collection(EMPLOYEES_COLLECTION)
        .where('userId', '==', userId)
        .where('companyId', '==', companyId)
        .limit(1)
        .get();
    return !snapshot.empty;
}

export async function createCompanyAndAddUser(userId: string, companyName: string): Promise<{newCompanyId: string}> {
    firestoreGuard();
    const batch = firestore.batch();

    // Create the company
    const newCompanyRef = firestore.collection(COMPANIES_COLLECTION).doc();
    batch.set(newCompanyRef, { name: companyName, ownerId: userId });

    // Create the employee link
    const newEmployeeLinkRef = firestore.collection(EMPLOYEES_COLLECTION).doc();
    batch.set(newEmployeeLinkRef, { userId, companyId: newCompanyRef.id, status: 'active', notes: 'Company creator' });
    
    // Also create a company profile
    const user = await getUserById(userId);
    if(user) {
        const companyProfileRef = firestore.collection(COMPANY_PROFILES_COLLECTION).doc(newCompanyRef.id);
        batch.set(companyProfileRef, {
            name: companyName,
            description: `Компанія ${companyName}`,
            adminId: user.id
        });
    }

    await batch.commit();
    return { newCompanyId: newCompanyRef.id };
}

export async function removeEmployeeLink(userId: string, companyId: string): Promise<{ success: boolean; message: string }> {
    firestoreGuard();

    // 1. Check if the user is the owner of the company
    const companyRef = firestore.collection(COMPANIES_COLLECTION).doc(companyId);
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists) {
        return { success: false, message: "Компанію не знайдено." };
    }
    if (companyDoc.data()?.ownerId === userId) {
        return { success: false, message: "Власник не може покинути компанію. Спочатку передайте права власності." };
    }

    // 2. Find the employee link document
    const employeeLinkQuery = await firestore.collection(EMPLOYEES_COLLECTION)
        .where('userId', '==', userId)
        .where('companyId', '==', companyId)
        .limit(1)
        .get();

    if (employeeLinkQuery.empty) {
        return { success: false, message: "Ви не є учасником цієї компанії." };
    }

    // 3. Delete the document
    const docToDelete = employeeLinkQuery.docs[0];
    await docToDelete.ref.delete();

    return { success: true, message: "Ви успішно покинули компанію." };
}


// --- Tasks ---
export const getAllTasksForCompany = (companyId: string) => getByQuery<Task>(TASKS_COLLECTION, 'companyId', companyId);
export const createTaskInDb = (companyId: string, data: Omit<Task, 'id'>) => create<Task>(TASKS_COLLECTION, { ...data, companyId });
export const updateTaskInDb = (companyId: string, id: string, updates: Partial<Task>) => update<Task>(TASKS_COLLECTION, id, companyId, updates);
export const deleteTaskFromDb = (companyId: string, id: string) => remove(TASKS_COLLECTION, id, companyId);

// --- Results ---
export const getAllResultsForCompany = (companyId: string) => getByQuery<Result>(RESULTS_COLLECTION, 'companyId', companyId);
export const createResultInDb = (companyId: string, data: Omit<Result, 'id'>) => create<Result>(RESULTS_COLLECTION, { ...data, companyId });
export const updateResultInDb = (companyId: string, id: string, updates: Partial<Result>) => update<Result>(RESULTS_COLLECTION, id, companyId, updates);
export const deleteResultFromDb = (companyId: string, id: string) => remove(RESULTS_COLLECTION, id, companyId);

// --- Templates ---
export const getAllTemplatesForCompany = (companyId: string) => getByQuery<Template>(TEMPLATES_COLLECTION, 'companyId', companyId);
export const createTemplateInDb = (companyId: string, data: Omit<Template, 'id'>) => create<Template>(TEMPLATES_COLLECTION, { ...data, companyId });
export const updateTemplateInDb = (companyId: string, id: string, updates: Partial<Template>) => update<Template>(TEMPLATES_COLLECTION, id, companyId, updates);
export const deleteTemplateFromDb = (companyId: string, id: string) => remove(TEMPLATES_COLLECTION, id, companyId);

// --- Employees ---
export const getAllEmployeesForCompany = (companyId: string) => getByQuery<Employee>(EMPLOYEES_COLLECTION, 'companyId', companyId);
export const createEmployeeInDb = (companyId: string, data: Omit<Employee, 'id'>) => create<Employee>(EMPLOYEES_COLLECTION, { ...data, companyId });
export const updateEmployeeInDb = (companyId: string, id: string, updates: Partial<Employee>) => update<Employee>(EMPLOYEES_COLLECTION, id, companyId, updates);
export const getEmployeeLinkForUser = async (userId: string): Promise<{ companyId: string } | null> => {
    const links = await getByQuery<{ companyId: string }>(EMPLOYEES_COLLECTION, 'userId', userId);
    return links[0] || null; // Return the first company link found
};

// --- Company Profile ---
export const getCompanyProfileFromDb = (companyId: string) => getDocAndValidateCompany<CompanyProfile>(COMPANY_PROFILES_COLLECTION, companyId, companyId);
export const updateCompanyProfileInDb = (companyId: string, updates: Partial<CompanyProfile>) => {
    firestoreGuard();
    const docRef = firestore.collection(COMPANY_PROFILES_COLLECTION).doc(companyId);
    return docRef.update(updates).then(() => getCompanyProfileFromDb(companyId));
};

// --- Processes ---
export const getAllProcessesForCompany = (companyId: string) => getByQuery<Process>(PROCESSES_COLLECTION, 'companyId', companyId);
export const getProcessById = (companyId: string, id: string) => getDocAndValidateCompany<Process>(PROCESSES_COLLECTION, id, companyId);
export const createProcessInDb = (companyId: string, data: Omit<Process, 'id'>) => create<Process>(PROCESSES_COLLECTION, { ...data, companyId });
export const updateProcessInDb = (companyId: string, id: string, updates: Partial<Process>) => update<Process>(PROCESSES_COLLECTION, id, companyId, updates);
export const deleteProcessFromDb = (companyId: string, id: string) => remove(PROCESSES_COLLECTION, id, companyId);

// --- Instructions ---
export const getAllInstructionsForCompany = (companyId: string) => getByQuery<Instruction>(INSTRUCTIONS_COLLECTION, 'companyId', companyId);
export const getInstructionById = (companyId: string, id: string) => getDocAndValidateCompany<Instruction>(INSTRUCTIONS_COLLECTION, id, companyId);
export const createInstructionInDb = (companyId: string, data: Omit<Instruction, 'id'>) => create<Instruction>(INSTRUCTIONS_COLLECTION, { ...data, companyId });
export const updateInstructionInDb = (companyId: string, id: string, updates: Partial<Instruction>) => update<Instruction>(INSTRUCTIONS_COLLECTION, id, companyId, updates);
export const deleteInstructionFromDb = (companyId: string, id: string) => remove(INSTRUCTIONS_COLLECTION, id, companyId);

// --- Audits ---
export const getAllAuditsForCompany = (companyId: string) => getByQuery<Audit>(AUDITS_COLLECTION, 'companyId', companyId);
export const getAuditById = (companyId: string, id: string) => getDocAndValidateCompany<Audit>(AUDITS_COLLECTION, id, companyId);
export const createAuditInDb = (companyId: string, data: Omit<Audit, 'id'>) => create<Audit>(AUDITS_COLLECTION, { ...data, companyId });
export const updateAuditInDb = (companyId: string, id: string, updates: Partial<Audit>) => update<Audit>(AUDITS_COLLECTION, id, companyId, updates);
export const deleteAuditFromDb = (companyId: string, id: string) => remove(AUDITS_COLLECTION, id, companyId);

// --- Telegram Groups ---
export const linkTelegramGroup = async (code: string, companyId: string): Promise<{ group: TelegramGroup, wasCreated: boolean }> => {
    firestoreGuard();
    const codeRef = firestore.collection(GROUP_LINK_CODES_COLLECTION).doc(code);
    const codeDoc = await codeRef.get();

    if (!codeDoc.exists) throw new Error("Невірний або застарілий код.");
    
    const codeData = codeDoc.data() as any;
    
    if (new Date() > codeData.expiresAt.toDate()) {
        await codeRef.delete();
        throw new Error("Невірний або застарілий код.");
    }

    const existingGroups = await getByQuery<TelegramGroup & { id: string }>(GROUPS_COLLECTION, 'tgGroupId', codeData.tgGroupId);
    const existingGroup = existingGroups.find(g => g.companyId === companyId);

    await codeRef.delete();

    if (existingGroup) {
        const updatedGroup = await update<TelegramGroup>(GROUPS_COLLECTION, existingGroup.id, companyId, { title: codeData.groupTitle, linkedAt: new Date().toISOString() });
        if (!updatedGroup) throw new Error("Failed to update existing group.");
        return { group: updatedGroup, wasCreated: false };
    } else {
        const newGroupData: Omit<TelegramGroup, 'id'> = {
            tgGroupId: codeData.tgGroupId,
            title: codeData.groupTitle,
            companyId: companyId,
            linkedAt: new Date().toISOString(),
        };
        const newGroup = await create<TelegramGroup>(GROUPS_COLLECTION, newGroupData);
        return { group: newGroup, wasCreated: true };
    }
};

export const getAllTelegramGroups = (companyId: string) => getByQuery<TelegramGroup>(GROUPS_COLLECTION, 'companyId', companyId);
export const getTelegramGroupById = (companyId: string, id: string) => getDocAndValidateCompany<TelegramGroup>(GROUPS_COLLECTION, id, companyId);
export const findTelegramGroupByTgId = async (tgGroupId: string) => {
    const groups = await getByQuery<TelegramGroup & {id: string}>(GROUPS_COLLECTION, 'tgGroupId', tgGroupId);
    return groups[0] || null;
}

// --- Telegram Message Logs ---
export const createTelegramLog = (companyId: string, data: Omit<MessageLog, 'id'>) => create<MessageLog>(TELEGRAM_LOGS_COLLECTION, { ...data, companyId });

export async function getTelegramLogsByGroupId(companyId: string, groupId: string): Promise<MessageLog[]> {
    firestoreGuard();
    const snapshot = await firestore.collection(TELEGRAM_LOGS_COLLECTION)
        .where('companyId', '==', companyId)
        .where('groupId', '==', groupId)
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MessageLog));
}

// --- Telegram Members ---
export const getMembersForGroupDb = (companyId: string, groupId: string) => getByQuery<TelegramMember>(TELEGRAM_MEMBERS_COLLECTION, 'groupId', groupId);

export async function upsertTelegramMember(companyId: string, memberData: Omit<TelegramMember, 'id' | 'employeeId'>) {
    firestoreGuard();
    const membersRef = firestore.collection(TELEGRAM_MEMBERS_COLLECTION);
    const q = membersRef
        .where('companyId', '==', companyId)
        .where('groupId', '==', memberData.groupId)
        .where('tgUserId', '==', memberData.tgUserId)
        .limit(1);
    const snapshot = await q.get();

    if (snapshot.empty) {
        await create<TelegramMember>(TELEGRAM_MEMBERS_COLLECTION, { ...memberData, employeeId: null, companyId });
    } else {
        const docId = snapshot.docs[0].id;
        const { tgUserId, groupId, ...updatableData } = memberData;
        await update<TelegramMember>(TELEGRAM_MEMBERS_COLLECTION, docId, companyId, updatableData);
    }
}

export const linkTelegramMemberToEmployeeInDb = (companyId: string, memberId: string, employeeId: string | null) => {
    return update<TelegramMember>(TELEGRAM_MEMBERS_COLLECTION, memberId, companyId, { employeeId });
};
