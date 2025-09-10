'use server';
/**
 * @fileOverview An AI flow for generating a business audit summary.
 *
 * - generateAuditSummary - Analyzes answers to audit questions and generates a running summary and list of potential problems.
 * - AuditSummaryInput - The input type for the flow.
 * - AuditSummaryOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const AuditSummaryInputSchema = z.object({
  currentSummary: z.string().describe('The summary generated so far from previous questions and answers.'),
  identifiedProblems: z.array(z.string()).describe('The list of problems identified so far.'),
  question: z.string().describe('The latest question that was asked.'),
  answer: z.string().describe('The answer provided by the user to the latest question.'),
});
export type AuditSummaryInput = z.infer<typeof AuditSummaryInputSchema>;

export const AuditSummaryOutputSchema = z.object({
  updatedSummary: z.string().describe('The updated, concise summary incorporating the new answer. It should be in Ukrainian.'),
  updatedProblems: z.array(z.string()).describe('The updated list of potential business problems or weaknesses identified. These should be actionable and clear. Formulate them in Ukrainian.'),
});
export type AuditSummaryOutput = z.infer<typeof AuditSummaryOutputSchema>;

export async function generateAuditSummary(input: AuditSummaryInput): Promise<AuditSummaryOutput> {
  return auditSummaryFlow(input);
}

const auditSummaryPrompt = ai.definePrompt({
  name: 'auditSummaryPrompt',
  input: { schema: AuditSummaryInputSchema },
  output: { schema: AuditSummaryOutputSchema },
  prompt: `You are a professional business consultant from Ukraine conducting an audit of a company. Your goal is to identify systemic weaknesses, especially those related to the "owner's trap" where the business heavily relies on the owner.

You will receive the current audit summary, a list of previously identified problems, the last question asked, and the user's answer.

Your task is to analyze the new answer in the context of the previous information and provide an updated summary and an updated list of problems.

- **Updated Summary:** Briefly and concisely integrate the key insights from the new answer into the existing summary. Keep it high-level. The summary must be in Ukrainian.
- **Updated Problems:** Based on the new answer, add to or refine the list of identified problems. Focus on concrete, actionable issues (e.g., "The owner is the only person who closes sales," "Marketing efforts are not measured with specific metrics," "There is no formal hiring process"). The problems must be in Ukrainian.

Current Summary:
{{{currentSummary}}}

Previously Identified Problems:
{{#each identifiedProblems}}
- {{{this}}}
{{/each}}

New Question: "{{{question}}}"
User's Answer: "{{{answer}}}"

Now, provide the updated summary and problem list in the required JSON format.
`,
});

const auditSummaryFlow = ai.defineFlow(
  {
    name: 'auditSummaryFlow',
    inputSchema: AuditSummaryInputSchema,
    outputSchema: AuditSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await auditSummaryPrompt(input);
    return output!;
  }
);
