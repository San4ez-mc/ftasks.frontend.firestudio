
'use server';

import type { Instruction } from '@/types/instruction';
import { mockInstructions } from '@/data/instructions-mock';
import { getUserSession } from '@/lib/session';

// NOTE: This file has been temporarily reverted to use mock data
// to restore the default instructions as requested.

let instructions: Instruction[] = mockInstructions;


export async function getInstructions(): Promise<Instruction[]> {
    // const session = await getUserSession();
    // if (!session) {
    //     console.error("No session found for getInstructions");
    //     return [];
    // }
    // return getAllInstructionsForCompany(session.companyId);
    return Promise.resolve(instructions);
}

export async function createInstruction(data: Omit<Instruction, 'id' | 'companyId'>): Promise<Instruction> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    
    const newInstruction: Instruction = {
        id: `instr-${Date.now()}`,
        companyId: session.companyId,
        ...data,
    };
    instructions.unshift(newInstruction);
    return Promise.resolve(newInstruction);
}

export async function updateInstruction(id: string, updates: Partial<Instruction>): Promise<Instruction | null> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");

    let updatedInstruction: Instruction | null = null;
    instructions = instructions.map(instr => {
        if (instr.id === id) {
            updatedInstruction = { ...instr, ...updates };
            return updatedInstruction;
        }
        return instr;
    });

    return Promise.resolve(updatedInstruction);
}

export async function deleteInstruction(id: string): Promise<{ success: boolean }> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");

    const initialLength = instructions.length;
    instructions = instructions.filter(p => p.id !== id);
    return Promise.resolve({ success: instructions.length < initialLength });
}
