
'use server';

import type { Instruction } from '@/types/instruction';
import { 
    getAllInstructions, 
    createInstructionInDb, 
    updateInstructionInDb, 
    deleteInstructionFromDb 
} from '@/lib/firestore-service';

export async function getInstructions(): Promise<Instruction[]> {
    return getAllInstructions();
}

export async function createInstruction(data: Omit<Instruction, 'id'>): Promise<Instruction> {
    return createInstructionInDb(data);
}

export async function updateInstruction(id: string, updates: Partial<Instruction>): Promise<Instruction | null> {
    return updateInstructionInDb(id, updates);
}

export async function deleteInstruction(id: string): Promise<{ success: boolean }> {
    return deleteInstructionFromDb(id);
}
