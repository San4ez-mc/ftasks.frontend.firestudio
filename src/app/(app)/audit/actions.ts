
'use server';

import { 
    getAuditById, 
    createAuditInDb, 
    updateAuditInDb,
    deleteAuditFromDb,
    getAllAuditsForCompany,
} from '@/lib/firestore-service';
import { getNextAuditStep } from '@/ai/flows/conversational-audit-flow';
import { generateWorkPlan as generateWorkPlanFlow } from '@/ai/flows/work-plan-flow';
import type { Audit, ConversationTurn, WorkPlanItem } from '@/types/audit';
import type { ConversationalAuditInput, ConversationalAuditOutput, AuditStructure } from '@/ai/types';
import { getUserSession } from '@/lib/session';
import { ai } from '@/ai/genkit';
import { getCurrentEmployee } from '@/app/(app)/company/actions';

async function getCompanyIdOrThrow(): Promise<string> {
    const session = await getUserSession();
    if (!session) {
        throw new Error("Not authenticated");
    }
    return session.companyId;
}

export async function getAudits(): Promise<Audit[]> {
    const companyId = await getCompanyIdOrThrow();
    return getAllAuditsForCompany(companyId);
}

export async function getAudit(id: string): Promise<Audit | null> {
    const companyId = await getCompanyIdOrThrow();
    return getAuditById(companyId, id);
}

export async function createAudit(): Promise<Audit> {
    const companyId = await getCompanyIdOrThrow();
    const currentUser = await getCurrentEmployee();

    if (!currentUser || !currentUser.userId) {
        throw new Error("Could not identify current user to create audit.");
    }

    const newAuditData: Omit<Audit, 'id' | 'companyId'> = {
        createdAt: new Date().toISOString(),
        conductedBy: {
            userId: currentUser.userId,
            userName: `${currentUser.firstName} ${currentUser.lastName}`.trim()
        },
        isCompleted: false,
        isAiComplete: false,
        structuredSummary: {},
        conversationHistory: [
            {
                role: 'model',
                text: 'Вітаю! Я ваш AI-асистент для проведення бізнес-аудиту. Щоб почати, розкажіть, будь ласка, чим займається ваша компанія?'
            }
        ],
        workPlan: [],
    };
    return createAuditInDb(companyId, newAuditData);
}

export async function updateAudit(id: string, updates: Partial<Audit>): Promise<Audit | null> {
    const companyId = await getCompanyIdOrThrow();
    return updateAuditInDb(companyId, id, updates);
}

export async function deleteAudit(id: string): Promise<{ success: boolean }> {
    const companyId = await getCompanyIdOrThrow();
    return deleteAuditFromDb(companyId, id);
}

// Custom output type for the robust audit action
export type ContinueAuditResponse = {
  success: true;
  data: ConversationalAuditOutput;
} | {
  success: false;
  error: string;
  userTranscript: string;
  updatedConversationHistory: ConversationTurn[];
};

export async function continueAudit(input: ConversationalAuditInput): Promise<ContinueAuditResponse> {
    const companyId = await getCompanyIdOrThrow();
    const currentAudit = await getAuditById(companyId, input.auditId);
    
    if (!currentAudit) {
        return { success: false, error: "AUDIT_NOT_FOUND", userTranscript: "", updatedConversationHistory: [] };
    }

    // 1. Get user transcript from audio or text
    let userTranscript: string;
    try {
        if (input.userAudioDataUri) {
            const transcribeResponse = await ai.generate({
                model: 'googleai/gemini-1.5-flash-latest',
                prompt: [{media: {url: input.userAudioDataUri, contentType: 'audio/webm'}}, {text: 'Транскрибуй це аудіо українською мовою. Прибери будь-які слова-паразити та заповнювачі пауз, такі як "еее", "ммм", "нуу", щоб текст був чистим та лаконічним.'}],
            });
            userTranscript = transcribeResponse.text;
        } else if (input.userText) {
            userTranscript = input.userText;
        } else {
            throw new Error("No user input provided.");
        }
    } catch (transcriptionError) {
        console.error("Transcription failed:", transcriptionError);
        return { success: false, error: "TRANSCRIPTION_FAILED", userTranscript: "", updatedConversationHistory: currentAudit.conversationHistory };
    }


    // 2. Save user's turn to the database immediately
    const updatedHistoryWithUser = [...currentAudit.conversationHistory, { role: 'user' as const, text: userTranscript }];
    await updateAuditInDb(companyId, input.auditId, { conversationHistory: updatedHistoryWithUser });

    // 3. Attempt to get the AI's response
    try {
        const aiResponse = await getNextAuditStep(updatedHistoryWithUser, currentAudit.structuredSummary);

        const finalHistory = [...updatedHistoryWithUser, { role: 'model' as const, text: aiResponse.aiResponseText }];
        const finalSummary = aiResponse.updatedSummary;
        
        // 4. Save AI response to the database
        await updateAuditInDb(companyId, input.auditId, { 
            conversationHistory: finalHistory,
            structuredSummary: finalSummary,
            isAiComplete: aiResponse.isComplete,
        });
        
        // 5. Return the successful result
        return {
            success: true,
            data: {
                aiResponseText: aiResponse.aiResponseText,
                userTranscript: userTranscript,
                updatedStructuredSummary: finalSummary,
                updatedConversationHistory: finalHistory,
                isAuditComplete: aiResponse.isComplete,
            }
        };

    } catch (aiError) {
        console.error("AI processing failed in audit:", aiError);
        // 6. Return a specific error if AI fails, but confirm user's input was saved
        return {
            success: false,
            error: 'AI_PROCESSING_FAILED',
            userTranscript: userTranscript,
            updatedConversationHistory: updatedHistoryWithUser, // Return history with the user's turn
        };
    }
}

/**
 * Retries only the AI processing step for the last user message in an audit.
 */
export async function retryAiProcessing(auditId: string): Promise<ContinueAuditResponse> {
    const companyId = await getCompanyIdOrThrow();
    
    const currentAudit = await getAuditById(companyId, auditId);
    if (!currentAudit) {
        return { success: false, error: "AUDIT_NOT_FOUND", userTranscript: "", updatedConversationHistory: [] };
    }

    const lastUserTurn = currentAudit.conversationHistory[currentAudit.conversationHistory.length - 1];
    
    // Attempt to get the AI's response again
    try {
        const aiResponse = await getNextAuditStep(currentAudit.conversationHistory, currentAudit.structuredSummary);
        const finalHistory = [...currentAudit.conversationHistory, { role: 'model' as const, text: aiResponse.aiResponseText }];
        const finalSummary = aiResponse.updatedSummary;
        
        // Save AI response to the database
        await updateAuditInDb(companyId, auditId, { 
            conversationHistory: finalHistory,
            structuredSummary: finalSummary,
            isAiComplete: aiResponse.isComplete,
        });
        
        return {
            success: true,
            data: {
                aiResponseText: aiResponse.aiResponseText,
                userTranscript: lastUserTurn?.text || '',
                updatedStructuredSummary: finalSummary,
                updatedConversationHistory: finalHistory,
                isAuditComplete: aiResponse.isComplete,
            }
        };

    } catch (aiError) {
        console.error("AI processing failed on retry:", aiError);
        return {
            success: false,
            error: 'AI_PROCESSING_FAILED',
            userTranscript: lastUserTurn?.text || '',
            updatedConversationHistory: currentAudit.conversationHistory,
        };
    }
}


export async function generateWorkPlan(summary: AuditStructure): Promise<WorkPlanItem[]> {
    const plan = await generateWorkPlanFlow({ structuredSummary: summary });
    return plan;
}

    
