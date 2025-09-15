
'use server';

import type { Instruction } from '@/types/instruction';
import { 
    getAllInstructionsForCompany, 
    createInstructionInDb, 
    updateInstructionInDb, 
    deleteInstructionFromDb 
} from '@/lib/firestore-service';
import { getUserSession } from '@/lib/session';
import { mockInstructions } from '@/data/instructions-mock';

let instructions: Instruction[] = mockInstructions;

export async function getInstructions(): Promise<Instruction[]> {
    // For now, we return mock data.
    // In the future, this will be replaced with a call to Firestore
    // const session = await getUserSession();
    // if (!session) return [];
    // return getAllInstructionsForCompany(session.companyId);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    return instructions;
}

export async function createInstruction(data: Omit<Instruction, 'id'>): Promise<Instruction> {
    // This is a mock implementation
    const newInstruction: Instruction = {
        id: `instr-${Date.now()}`,
        ...data,
    };
    instructions.unshift(newInstruction);
    return newInstruction;

    // Real implementation:
    // const session = await getUserSession();
    // if (!session) throw new Error("Not authenticated");
    // return createInstructionInDb(session.companyId, data);
}

export async function updateInstruction(id: string, updates: Partial<Instruction>): Promise<Instruction | null> {
     // This is a mock implementation
    let updatedInstruction: Instruction | null = null;
    instructions = instructions.map(instr => {
        if (instr.id === id) {
            updatedInstruction = { ...instr, ...updates };
            return updatedInstruction;
        }
        return instr;
    });
    return updatedInstruction;

    // Real implementation:
    // const session = await getUserSession();
    // if (!session) throw new Error("Not authenticated");
    // return updateInstructionInDb(session.companyId, id, updates);
}

export async function deleteInstruction(id: string): Promise<{ success: boolean }> {
    // This is a mock implementation
    const initialLength = instructions.length;
    instructions = instructions.filter(p => p.id !== id);
    return { success: instructions.length < initialLength };

    // Real implementation:
    // const session = await getUserSession();
    // if (!session) throw new Error("Not authenticated");
    // return deleteInstructionFromDb(session.companyId, id);
}
