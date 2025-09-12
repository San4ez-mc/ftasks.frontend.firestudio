
'use server';
/**
 * @fileOverview An AI flow for generating a post-audit work plan.
 *
 * - generateWorkPlan - Analyzes a structured audit summary and creates a problem/solution work plan.
 * - WorkPlanInput - The input type for the flow.
 * - WorkPlanOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import {
  WorkPlanInput,
  WorkPlanOutput,
  WorkPlanInputSchema,
  WorkPlanOutputSchema,
} from '@/ai/types';

export async function generateWorkPlan(input: WorkPlanInput): Promise<WorkPlanOutput> {
  return workPlanFlow(input);
}

const workPlanPrompt = ai.definePrompt({
  name: 'workPlanPrompt',
  input: { schema: WorkPlanInputSchema },
  output: { schema: WorkPlanOutputSchema },
  prompt: `You are a professional business consultant from Ukraine. Your task is to analyze the provided JSON summary of a business audit and generate a high-level work plan.

Focus on identifying systemic weaknesses, especially those related to the "owner's trap" where the business is too dependent on the owner.

For each identified weakness, create a clear "Problem" and "Solution" pair.
- **Department:** Categorize the problem into a relevant business department (e.g., "Маркетинг", "Продажі", "Фінанси", "Операційна діяльність", "Команда та ролі").
- **Problem:** A concise statement of the current issue (e.g., "CRM system is not used," "No formal hiring process," "Owner is the only person closing sales").
- **Solution:** A description of the desired future state, framed as an achievable goal (e.g., "CRM system is configured for company processes, tracking leads and sales," "A documented hiring and onboarding process is implemented," "Sales scripts are created and a sales manager is trained to handle deals").
- **Timeline:** Provide an estimated implementation timeline in months for each solution.

The entire output, including all fields, MUST be in UKRAINIAN.

Here is the business audit summary:
\`\`\`json
{{{json structuredSummary}}}
\`\`\`

Now, provide the work plan as a JSON array of objects, where each object has a 'department', 'problem', 'solution', and 'timelineMonths' key.
`,
});

const workPlanFlow = ai.defineFlow(
  {
    name: 'workPlanFlow',
    inputSchema: WorkPlanInputSchema,
    outputSchema: WorkPlanOutputSchema,
  },
  async (input) => {
    const { output } = await workPlanPrompt(input);
    return output!;
  }
);
