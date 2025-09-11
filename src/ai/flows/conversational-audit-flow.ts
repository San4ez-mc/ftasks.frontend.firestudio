
'use server';
/**
 * @fileOverview A conversational AI flow for conducting a business audit.
 *
 * - continueAudit - Handles the conversational turn-based audit process.
 * - ConversationalAuditInput - The input type for the flow.
 * - ConversationalAuditOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {
  ConversationalAuditInput,
  ConversationalAuditOutput,
  ConversationalAuditInputSchema,
  ConversationalAuditOutputSchema,
  AuditStructureSchema,
  ConversationTurnSchema,
} from '@/ai/types';
import {z} from 'zod';

export async function continueAudit(
  input: ConversationalAuditInput
): Promise<ConversationalAuditOutput> {
  return conversationalAuditFlow(input);
}

const auditPrompt = ai.definePrompt({
  name: 'conversationalAuditPrompt',
  input: {
    schema: z.object({
      conversationHistory: z.array(ConversationTurnSchema),
      currentSummary: AuditStructureSchema,
    }),
  },
  output: {
    schema: z.object({
      nextQuestion: z.string().describe('The next concise question to ask the user to continue the audit. Must be in Ukrainian.'),
      updatedSummary: AuditStructureSchema.describe('The updated JSON object with all new information from the user\'s last answer. Preserve existing data.'),
      thought: z.string().describe('Your brief thought process for why you are asking this question. In Ukrainian.'),
    }),
  },
  prompt: `You are an expert business consultant conducting an audit of a company by having a conversation with the business owner. Your goal is to progressively fill out a structured JSON object with key business information.

You MUST conduct the entire conversation in UKRAINIAN.

**Your Persona & Tone:**
- You are friendly, supportive, and conversational. Your goal is to make the business owner feel comfortable and understood.
- Maintain a positive and encouraging tone.
- Start your questions with friendly, natural-sounding phrases. For example, instead of just asking "How many employees are there?", you could say "Чудово, дякую! Давайте тепер поговоримо про вашу команду. Скільки у вас співробітників?" (Great, thanks! Now let's talk about your team. How many employees do you have?).

**Your Task:**
1. You will be given the current state of the JSON summary and the full conversation history.
2. Your primary goal is to gather information to fill out the 'updatedSummary' JSON object.
3. Based on the user's LAST response, update the JSON summary with any new information you've learned.
4. Then, formulate the VERY NEXT question you need to ask to continue gathering information according to the audit plan below.
5. If the user's answer is vague, ask a clarifying question in a friendly manner.
6. If the user goes off-topic, gently guide them back to the audit plan.
7. Keep your questions concise and ask only one question at a time.

**Audit Plan (Follow this order):**
1.  **Company Profile:**
    *   What does the company do? What is its main product or service? Are there multiple?
    *   What is the main business process in one sentence? (e.g., "We get clients from ads, consult them, and they pay for the service").
2.  **Team & Roles:**
    *   How many employees are there?
    *   Who performs which role in the main business process? What other duties do they have?
3.  **Owner's Involvement (if you are talking to the owner):**
    *   What specific tasks do YOU, the owner, perform regularly? Be detailed.
4.  **Marketing:**
    *   How do clients find you? Is it word-of-mouth or advertising?
    *   Is the flow of new leads manageable and predictable?
    *   Do you calculate the cost per lead or other metrics?
    *   Do you use a system (CRM, spreadsheet) to track leads?
5.  **Sales:**
    *   Who is responsible for the main sales?
    *   Describe the sales process.
    *   Are there sales scripts?
    *   Is a CRM system used for sales? Have you tried to set one up?
6.  **Finance:**
    *   Do you clearly understand your company's profit?
    *   Do you maintain a P&L, Cash Flow statement, or Balance Sheet?
    *   Is the owner's personal budget separate from the business budget? (CRITICAL question)
    *   What systems/tools do you use for financial accounting?
    *   Do you calculate the profitability of individual products or projects?
7.  **Production/Service Delivery:**
    *   Who is the primary person responsible for producing the product or delivering the service?
    *   If it's the owner, have they tried to delegate this responsibility to someone else?

**Current Conversation History:**
{{#each conversationHistory}}
- {{role}}: {{text}}
{{/each}}

**Current JSON Summary (update this):**
\`\`\`json
{{{json currentSummary}}}
\`\`\`
`,
});


const conversationalAuditFlow = ai.defineFlow(
  {
    name: 'conversationalAuditFlow',
    inputSchema: ConversationalAuditInputSchema,
    outputSchema: ConversationalAuditOutputSchema,
  },
  async ({userAudioDataUri, conversationHistory, currentSummary}) => {
    // Step 1: Transcribe the audio cleanly
    const transcribeResponse = await ai.generate({
        model: 'googleai/gemini-1.5-flash-latest',
        prompt: [{media: {url: userAudioDataUri, contentType: 'audio/webm'}}, {text: 'Транскрибуй це аудіо українською мовою. Прибери будь-які слова-паразити та заповнювачі пауз, такі як "еее", "ммм", "нуу", щоб текст був чистим та лаконічним.'}],
    });
    const userTranscript = transcribeResponse.text;

    // Step 2: Update conversation history with the new transcript
    const updatedConversationHistory: ConversationTurn[] = [
      ...conversationHistory,
      {role: 'user' as const, text: userTranscript},
    ];

    // Step 3: Call the main conversational AI
    const {output} = await auditPrompt({
      conversationHistory: updatedConversationHistory,
      currentSummary: currentSummary,
    });
    
    if (!output) {
        throw new Error("The audit AI did not return a valid response.");
    }
    
    const { nextQuestion, updatedSummary } = output;

    // Step 4: Add the AI's question to the history for the next turn
    const finalConversationHistory: ConversationTurn[] = [
      ...updatedConversationHistory,
      {role: 'model' as const, text: nextQuestion},
    ];
    
    return {
      aiResponseText: nextQuestion,
      updatedStructuredSummary: updatedSummary,
      userTranscript: userTranscript,
      updatedConversationHistory: finalConversationHistory,
      isAuditComplete: false, 
    };
  }
);
