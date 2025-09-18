// src/lib/firestore-service.ts
'use server';

import { getDb } from '@/lib/firebase-admin';
import { FieldPath } from 'firebase-admin/firestore';
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
import type { Department, Division } from '@/types/org-structure';
import type { Session } from '@/types/session';


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
const DIVISIONS_COLLECTION = 'divisions';
const DEPARTMENTS_COLLECTION = 'departments';
const SESSIONS_COLLECTION = 'sessions';


// Manual implementation to avoid date-fns dependency issues on the server.
function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// --- Generic Firestore Functions ---
async function handleFirestoreError(error: any, context: string): Promise<any> {
    // 5 is the gRPC status code for NOT_FOUND
    if (error.code === 5) {
        console.warn(`Firestore 'NOT_FOUND' error in context: ${context}. This is expected on a new project. Returning empty/null result.`);
        
        if (context.startsWith('getByQuery')) {
             return [];
        }
        return null;
    }
    const errorMessage = `A database error occurred. Please check server logs. Context: ${context}`;
    console.error(errorMessage, error);
    throw new Error(errorMessage);
}


async function getByQuery<T>(collectionName: string, queryField: string, queryValue: string): Promise<T[]> {
  try {
    const snapshot = await getDb().collection(collectionName).where(queryField, '==', queryValue).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  } catch (error) {
    return handleFirestoreError(error, `getByQuery on ${collectionName}`);
  }
}

async function getDocAndValidateCompany<T>(collectionName: string, id: string, companyId: string): Promise<T | null> {
    try {
        const docRef = getDb().collection(collectionName).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return null;
        }

        const data = doc.data();
        
        if (collectionName === COMPANY_PROFILES_COLLECTION) {
            if (doc.id !== companyId) {
                console.warn(`Attempted to access document in ${collectionName} with ID ${id} from wrong company ${companyId}.`);
                return null;
            }
        } else if (data?.companyId !== companyId) {
            console.warn(`Attempted to access document in ${collectionName} with ID ${id} from wrong company ${companyId}.`);
            return null; 
        }
        
        return { id: doc.id, ...data } as T;
    } catch (error) {
        return handleFirestoreError(error, `getDocAndValidateCompany on ${collectionName}/${id}`);
    }
}

async function create<T extends { id?: string }>(collectionName: string, data: Omit<T, 'id'>): Promise<T> {
  try {
    const { id, ...rest } = data as any;
    const docRef = await getDb().collection(collectionName).add(rest);
    const newDoc = await docRef.get();
    return { id: newDoc.id, ...newDoc.data() } as T;
  } catch (error) {
    return handleFirestoreError(error, `create in ${collectionName}`);
  }
}

async function update<T>(collectionName: string, docId: string, companyId: string, updates: Partial<T>): Promise<T | null> {
  try {
    const doc = await getDocAndValidateCompany<T & {id: string}>(collectionName, docId, companyId);
    if (!doc) {
        return null;
    }
    
    const docRef = getDb().collection(collectionName).doc(docId);
    await docRef.update(updates);
    
    const updatedDoc = await docRef.get();
    return updatedDoc.exists ? { id: updatedDoc.id, ...updatedDoc.data() } as T : null;
  } catch (error) {
    return handleFirestoreError(error, `update on ${collectionName}/${docId}`);
  }
}

async function remove(collectionName: string, docId: string, companyId: string): Promise<{ success: boolean }> {
  try {
    const doc = await getDocAndValidateCompany(collectionName, docId, companyId);
     if (!doc) {
        return { success: false };
    }
    await getDb().collection(collectionName).doc(docId).delete();
    return { success: true };
  } catch (error) {
    return handleFirestoreError(error, `remove on ${collectionName}/${docId}`);
  }
}

// --- Service-Specific Functions ---

// --- Session Management ---
export async function createSession(data: Omit<Session, 'id'>): Promise<Session> {
    try {
        const docRef = await getDb().collection(SESSIONS_COLLECTION).add(data);
        return { id: docRef.id, ...data };
    } catch (error) {
        return handleFirestoreError(error, 'createSession');
    }
}

export async function getSession(sessionId: string): Promise<(Session & { id: string }) | null> {
    try {
        const doc = await getDb().collection(SESSIONS_COLLECTION).doc(sessionId).get();
        if (!doc.exists) {
            return null;
        }
        return { id: doc.id, ...doc.data() } as Session & { id: string };
    } catch (error) {
        return handleFirestoreError(error, `getSession for session ${sessionId}`);
    }
}

export async function deleteSession(sessionId: string): Promise<{ success: boolean }> {
    try {
        await getDb().collection(SESSIONS_COLLECTION).doc(sessionId).delete();
        return { success: true };
    } catch (error) {
        return handleFirestoreError(error, `deleteSession for session ${sessionId}`);
    }
}


// --- Auth Related ---
export async function findUserByTelegramId(telegramUserId: string): Promise<(User & { id: string }) | null> {
    const users = await getByQuery<User & {id: string}>(USERS_COLLECTION, 'telegramUserId', telegramUserId);
    return users[0] || null;
}
export async function getUserById(userId: string): Promise<(User & { id: string }) | null> {
    try {
        const doc = await getDb().collection(USERS_COLLECTION).doc(userId).get();
        return doc.exists ? { id: doc.id, ...doc.data() } as User & { id: string } : null;
    } catch (error) {
        return handleFirestoreError(error, `getUserById for user ${userId}`);
    }
}

export async function getCompaniesForUser(userId: string): Promise<{id: string, name: string}[]> {
    const employeeLinks = await getByQuery<{companyId: string}>(EMPLOYEES_COLLECTION, 'userId', userId);
    if (employeeLinks.length === 0) return [];

    const companyIds = employeeLinks.map(link => link.companyId);
    
    const companiesSnapshot = await getDb().collection(COMPANIES_COLLECTION).where(FieldPath.documentId(), 'in', companyIds).get();
    
    return companiesSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
}

export async function isUserMemberOfCompany(userId: string, companyId: string): Promise<boolean> {
    const snapshot = await getDb().collection(EMPLOYEES_COLLECTION)
        .where('userId', '==', userId)
        .where('companyId', '==', companyId)
        .limit(1)
        .get();
    return !snapshot.empty;
}

export async function createCompanyAndAddUser(userId: string, companyName: string): Promise<{newCompanyId: string}> {
    try {
        const batch = getDb().batch();

        const user = await getUserById(userId);
        if (!user) {
            throw new Error(`User with ID ${userId} not found.`);
        }

        const newCompanyRef = getDb().collection(COMPANIES_COLLECTION).doc();
        batch.set(newCompanyRef, { name: companyName, ownerId: userId });

        const newEmployeeRef = getDb().collection(EMPLOYEES_COLLECTION).doc();
        batch.set(newEmployeeRef, {
            userId: user.id,
            companyId: newCompanyRef.id,
            firstName: user.firstName,
            lastName: user.lastName || '',
            telegramUserId: user.telegramUserId || '',
            telegramUsername: user.telegramUsername || '',
            avatar: user.avatar || `https://i.pravatar.cc/150?u=${user.telegramUsername}`,
            status: 'active',
            notes: 'Company creator',
            positions: [],
            groups: [],
            synonyms: [],
        });

        const trialEndDate = addDays(new Date(), 30);
        const companyProfileRef = getDb().collection(COMPANY_PROFILES_COLLECTION).doc(newCompanyRef.id);
        batch.set(companyProfileRef, {
            name: companyName,
            description: `Компанія ${companyName}`,
            adminId: newEmployeeRef.id,
            subscriptionTier: 'free',
            trialEnds: trialEndDate.toISOString(),
        });

        await batch.commit();
        return { newCompanyId: newCompanyRef.id };
    } catch (error) {
        return handleFirestoreError(error, `createCompanyAndAddUser for user ${userId}`);
    }
}


export async function removeEmployeeLink(userId: string, companyId: string): Promise<{ success: boolean; message: string }> {
    try {
        const companyRef = getDb().collection(COMPANIES_COLLECTION).doc(companyId);
        const companyDoc = await companyRef.get();
        if (!companyDoc.exists) {
            return { success: false, message: "Компанію не знайдено." };
        }
        if (companyDoc.data()?.ownerId === userId) {
            return { success: false, message: "Власник не може покинути компанію. Спочатку передайте права власності." };
        }

        const employeeLinkQuery = await getDb().collection(EMPLOYEES_COLLECTION)
            .where('userId', '==', userId)
            .where('companyId', '==', companyId)
            .limit(1)
            .get();

        if (employeeLinkQuery.empty) {
            return { success: false, message: "Ви не є учасником цієї компанії." };
        }

        const docToDelete = employeeLinkQuery.docs[0];
        await docToDelete.ref.delete();

        return { success: true, message: "Ви успішно покинули компанію." };
    } catch (error) {
        return handleFirestoreError(error, `removeEmployeeLink for user ${userId} from company ${companyId}`);
    }
}


// --- Tasks ---
export const getAllTasksForCompany = (companyId: string) => getByQuery<Task>(TASKS_COLLECTION, 'companyId', companyId);
export const getTaskById = (companyId: string, id: string) => getDocAndValidateCompany<Task>(TASKS_COLLECTION, id, companyId);
export const createTaskInDb = (companyId: string, data: Omit<Task, 'id' | 'companyId'>) => create<Task>(TASKS_COLLECTION, { ...data, companyId });
export const updateTaskInDb = (companyId: string, id: string, updates: Partial<Task>) => update<Task>(TASKS_COLLECTION, id, companyId, updates);
export const deleteTaskFromDb = (companyId: string, id: string) => remove(TASKS_COLLECTION, id, companyId);

// --- Results ---
export const getAllResultsForCompany = (companyId: string) => getByQuery<Result>(RESULTS_COLLECTION, 'companyId', companyId);
export const getResultById = (companyId: string, id: string) => getDocAndValidateCompany<Result>(RESULTS_COLLECTION, id, companyId);
export const createResultInDb = (companyId: string, data: Omit<Result, 'id' | 'companyId'>) => create<Result>(RESULTS_COLLECTION, { ...data, companyId });
export const updateResultInDb = (companyId: string, id: string, updates: Partial<Result>) => update<Result>(RESULTS_COLLECTION, id, companyId, updates);
export const deleteResultFromDb = (companyId: string, id: string) => remove(RESULTS_COLLECTION, id, companyId);

// --- Templates ---
export const getAllTemplatesForCompany = (companyId: string) => getByQuery<Template>(TEMPLATES_COLLECTION, 'companyId', companyId);
export const createTemplateInDb = (companyId: string, data: Omit<Template, 'id' | 'companyId'>) => create<Template>(TEMPLATES_COLLECTION, { ...data, companyId });
export const updateTemplateInDb = (companyId: string, id: string, updates: Partial<Template>) => update<Template>(TEMPLATES_COLLECTION, id, companyId, updates);
export const deleteTemplateFromDb = (companyId: string, id: string) => remove(TEMPLATES_COLLECTION, id, companyId);

// --- Employees ---
export const getAllEmployeesForCompany = (companyId: string) => getByQuery<Employee>(EMPLOYEES_COLLECTION, 'companyId', companyId);
export const createEmployeeInDb = (companyId: string, data: Omit<Employee, 'id' | 'companyId'>) => create<Employee>(EMPLOYEES_COLLECTION, { ...data, companyId });
export const updateEmployeeInDb = (companyId: string, id: string, updates: Partial<Employee>) => update<Employee>(EMPLOYEES_COLLECTION, id, companyId, updates);
export const getEmployeeLinkForUser = async (userId: string): Promise<{ companyId: string } | null> => {
    const links = await getByQuery<{ companyId: string }>(EMPLOYEES_COLLECTION, 'userId', userId);
    return links[0] || null;
};

// --- Company Profile ---
export const getCompanyProfileFromDb = async (companyId: string): Promise<CompanyProfile | null> => {
    try {
        const docRef = getDb().collection(COMPANY_PROFILES_COLLECTION).doc(companyId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return null;
        }
        
        return { id: doc.id, ...doc.data() } as CompanyProfile;
    } catch (error) {
        return handleFirestoreError(error, `getCompanyProfileFromDb for company ${companyId}`);
    }
};

export const updateCompanyProfileInDb = async (companyId: string, updates: Partial<CompanyProfile>): Promise<CompanyProfile | null> => {
    try {
        const docRef = getDb().collection(COMPANY_PROFILES_COLLECTION).doc(companyId);
        await docRef.update(updates);
        return getCompanyProfileFromDb(companyId);
    } catch(error) {
        return handleFirestoreError(error, `updateCompanyProfileInDb for company ${companyId}`);
    }
};

// --- Org Structure ---
export const getDivisionsForCompany = (companyId: string) => getByQuery<Division>(DIVISIONS_COLLECTION, 'companyId', companyId);
export const getDepartmentsForCompany = (companyId: string) => getByQuery<Department>(DEPARTMENTS_COLLECTION, 'companyId', companyId);

export async function saveOrgStructure(companyId: string, divisions: Division[], departments: Department[]): Promise<{ success: boolean }> {
    try {
        const batch = getDb().batch();
        const existingDivisions = await getDivisionsForCompany(companyId);
        const existingDepartments = await getDepartmentsForCompany(companyId);

        const newDivisionIds = new Set(divisions.map(d => d.id));
        const newDepartmentIds = new Set(departments.map(d => d.id));

        for (const div of existingDivisions) {
            if (!newDivisionIds.has(div.id)) {
                batch.delete(getDb().collection(DIVISIONS_COLLECTION).doc(div.id));
            }
        }

        for (const dept of existingDepartments) {
            if (!newDepartmentIds.has(dept.id)) {
                batch.delete(getDb().collection(DEPARTMENTS_COLLECTION).doc(dept.id));
            }
        }

        for (const div of divisions) {
            const { id, ...data } = div;
            const ref = getDb().collection(DIVISIONS_COLLECTION).doc(id);
            batch.set(ref, { ...data, companyId });
        }

        for (const dept of departments) {
            const { id, ...data } = dept;
            const ref = getDb().collection(DEPARTMENTS_COLLECTION).doc(id);
            batch.set(ref, { ...data, companyId });
        }
        
        await batch.commit();
        return { success: true };
    } catch (error) {
        return handleFirestoreError(error, `saveOrgStructure for company ${companyId}`);
    }
}


// --- Processes ---
export const getAllProcessesForCompany = (companyId: string) => getByQuery<Process>(PROCESSES_COLLECTION, 'companyId', companyId);
export const getProcessById = (companyId: string, id: string) => getDocAndValidateCompany<Process>(PROCESSES_COLLECTION, id, companyId);
export const createProcessInDb = (companyId: string, data: Omit<Process, 'id' | 'companyId'>) => create<Process>(PROCESSES_COLLECTION, { ...data, companyId });
export const updateProcessInDb = (companyId: string, id: string, updates: Partial<Process>) => update<Process>(PROCESSES_COLLECTION, id, companyId, updates);
export const deleteProcessFromDb = (companyId: string, id: string) => remove(PROCESSES_COLLECTION, id, companyId);

// --- Instructions ---
export const getAllInstructionsForCompany = (companyId: string) => getByQuery<Instruction>(INSTRUCTIONS_COLLECTION, 'companyId', companyId);
export const getInstructionById = (companyId: string, id: string) => getDocAndValidateCompany<Instruction>(INSTRUCTIONS_COLLECTION, id, companyId);
export const createInstructionInDb = (companyId: string, data: Omit<Instruction, 'id' | 'companyId'>) => create<Instruction>(INSTRUCTIONS_COLLECTION, { ...data, companyId });
export const updateInstructionInDb = (companyId: string, id: string, updates: Partial<Instruction>) => update<Instruction>(INSTRUCTIONS_COLLECTION, id, companyId, updates);
export const deleteInstructionFromDb = (companyId: string, id: string) => remove(INSTRUCTIONS_COLLECTION, id, companyId);

// --- Audits ---
export const getAllAuditsForCompany = (companyId: string) => getByQuery<Audit>(AUDITS_COLLECTION, 'companyId', companyId);
export const getAuditById = (companyId: string, id: string) => getDocAndValidateCompany<Audit>(AUDITS_COLLECTION, id, companyId);
export const createAuditInDb = (companyId: string, data: Omit<Audit, 'id' | 'companyId'>) => create<Audit>(AUDITS_COLLECTION, { ...data, companyId });
export const updateAuditInDb = (companyId: string, id: string, updates: Partial<Audit>) => update<Audit>(AUDITS_COLLECTION, id, companyId, updates);
export const deleteAuditFromDb = (companyId: string, id: string) => remove(AUDITS_COLLECTION, id, companyId);

// --- Telegram Groups ---
export const linkTelegramGroup = async (code: string, companyId: string): Promise<{ group: TelegramGroup, wasCreated: boolean }> => {
    const codeRef = getDb().collection(GROUP_LINK_CODES_COLLECTION).doc(code);
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
        const newGroupData: Omit<TelegramGroup, 'id' | 'companyId'> = {
            tgGroupId: codeData.tgGroupId,
            title: codeData.groupTitle,
            linkedAt: new Date().toISOString(),
        };
        const newGroup = await create<TelegramGroup>(GROUPS_COLLECTION, { ...newGroupData, companyId });
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
export const createTelegramLog = (companyId: string, data: Omit<MessageLog, 'id' | 'companyId'>) => create<MessageLog>(TELEGRAM_LOGS_COLLECTION, { ...data, companyId });

export async function getTelegramLogsByGroupId(companyId: string, groupId: string): Promise<MessageLog[]> {
    const snapshot = await getDb().collection(TELEGRAM_LOGS_COLLECTION)
        .where('companyId', '==', companyId)
        .where('groupId', '==', groupId)
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MessageLog));
}

// --- Telegram Members ---
export const getMembersForGroupDb = (companyId: string, groupId: string) => getByQuery<TelegramMember>(TELEGRAM_MEMBERS_COLLECTION, 'groupId', groupId);

export async function upsertTelegramMember(companyId: string, memberData: Omit<TelegramMember, 'id' | 'companyId' | 'employeeId'>) {
    try {
        const membersRef = getDb().collection(TELEGRAM_MEMBERS_COLLECTION);
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
    } catch (error) {
        return handleFirestoreError(error, `upsertTelegramMember for user ${memberData.tgUserId}`);
    }
}

export const linkTelegramMemberToEmployeeInDb = (companyId: string, memberId: string, employeeId: string | null) => {
    return update<TelegramMember>(TELEGRAM_MEMBERS_COLLECTION, memberId, companyId, { employeeId });
};