'use server';
/**
 * @fileOverview A conversational AI flow for conducting a business audit.
 *
 * - getNextAuditStep - Analyzes conversation history and summary to determine the next question.
 */

import {ai} from '@/ai/genkit';
import {
  AuditStructure,
  AuditStructureSchema,
  ConversationTurn,
  ConversationTurnSchema,
} from '@/ai/types';
import {z} from 'zod';

/**
 * This function takes the current state of an audit conversation and returns the AI's next step.
 * It's designed to be called from a server action that handles the database transactions.
 * @param conversationHistory The full history of the conversation so far.
 * @param currentSummary The current structured data gathered from the conversation.
 * @returns An object containing the AI's next response, the updated structured summary, and a completion flag.
 */
export async function getNextAuditStep(
  conversationHistory: ConversationTurn[],
  currentSummary: AuditStructure,
): Promise<{ aiResponseText: string; updatedSummary: AuditStructure, isComplete: boolean }> {
  const { output } = await auditPrompt({
      conversationHistory,
      currentSummary,
  });

  if (!output) {
      throw new Error("The audit AI did not return a valid response.");
  }
  
  return {
    aiResponseText: output.aiResponseText,
    updatedSummary: output.updatedSummary,
    isComplete: output.isComplete,
  };
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
      aiResponseText: z.string().describe("The AI's full response to the user. It should contain a brief, insightful comment on the user's last answer, followed by the next question. Must be in Ukrainian. If the audit is complete, this should be a concluding remark."),
      updatedSummary: AuditStructureSchema.describe('The updated JSON object with all new information from the user\'s last answer. Preserve existing data.'),
      thought: z.string().describe('Your brief thought process for why you are asking this question. In Ukrainian.'),
      isComplete: z.boolean().describe("Set to true only when all questions in the audit plan have been sufficiently answered. Otherwise, set to false."),
    }),
  },
  prompt: `You are an expert business consultant conducting an audit of a company by having a conversation with the business owner. Your goal is to progressively fill out a structured JSON object with key business information.

You MUST conduct the entire conversation in UKRAINIAN.

**Your Persona & Tone:**
- You are friendly, supportive, and an expert consultant. Your goal is to make the business owner feel comfortable and that they are talking to a professional.
- Your role is a consultant (masculine). Always use appropriate grammatical forms (e.g., "я проаналізував", "я б рекомендував").
- Maintain a positive and encouraging tone.

**Your Task:**
1.  You will be given the current state of the JSON summary and the full conversation history.
2.  Your primary goal is to gather information to fill out the 'updatedSummary' JSON object.
3.  Based on the user's LAST response, update the JSON summary with any new information you've learned.
4.  **Provide Insight:** Before asking the next question, give a brief (1-2 sentences) observation or insight based on the user's answer. This makes the audit feel like a real consultation. For example, if the user says leads come from referrals, you could say: "Це говорить про гарну репутацію, але може створювати ризики при масштабуванні. Добре, зафіксував." (This indicates a good reputation but can create risks when scaling. Okay, noted.)
5.  **Formulate Next Question:** After your comment, formulate the VERY NEXT question you need to ask to continue gathering information according to the audit plan below.
6.  Combine your insight and the next question into a single, natural-sounding response in the 'aiResponseText' field.
7.  If the user's answer is vague, ask a clarifying question in a friendly manner.
8.  Keep your questions concise and ask only one question at a time.
9.  When you have gathered sufficient information for ALL sections of the Audit Plan, set the 'isComplete' flag to true in your response and provide a concluding remark in 'aiResponseText'. Otherwise, keep 'isComplete' false.

**Audit Plan (Follow this order):**
1.  **Company Profile:**
    *   What does the company do? What is its main product or service? Are there multiple?
    *   What is the main business process? When you ask this, first briefly explain what a business process is (the sequence of steps from attracting a client to delivering the service). Then, start with a guiding question like, "Давайте пройдемося по вашому основному бізнес-процесу. З чого все починається? Як клієнти про вас дізнаються?" (Let's walk through your main business process. What does it start with? How do clients learn about you?).
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