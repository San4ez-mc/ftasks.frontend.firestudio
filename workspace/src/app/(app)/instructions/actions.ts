
'use server';

import type { Instruction } from '@/types/instruction';
import { 
    getAllInstructionsForCompany, 
    createInstructionInDb, 
    updateInstructionInDb, 
    deleteInstructionFromDb 
} from '@/lib/firestore-service';
import { getUserSession } from '@/lib/session';

export async function getInstructions(): Promise<Instruction[]> {
    const session = await getUserSession();
    if (!session) {
        console.error("No session found for getInstructions");
        return [];
    }
    return getAllInstructionsForCompany(session.companyId);
}

export async function createInstruction(data: Omit<Instruction, 'id' | 'companyId'>): Promise<Instruction> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    
    return createInstructionInDb(session.companyId, data);
}

export async function updateInstruction(id: string, updates: Partial<Instruction>): Promise<Instruction | null> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");

    return updateInstructionInDb(session.companyId, id, updates);
}

export async function deleteInstruction(id: string): Promise<{ success: boolean }> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");

    return deleteInstructionFromDb(session.companyId, id);
}
