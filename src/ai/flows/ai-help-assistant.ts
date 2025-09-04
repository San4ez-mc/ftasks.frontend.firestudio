'use server';

/**
 * @fileOverview An AI-powered assistant to provide contextual help for application pages.
 *
 * - getHelpContent - A function that returns helpful information about a specific page.
 * - HelpContentInput - The input type for the getHelpContent function.
 * - HelpContentOutput - The return type for the getHelpContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const HelpContentInputSchema = z.object({
  pageName: z.string().describe('The unique identifier for the page, e.g., "tasks", "results", "org-structure".'),
});
export type HelpContentInput = z.infer<typeof HelpContentInputSchema>;

const HelpContentOutputSchema = z.object({
  title: z.string().describe('A welcoming title for the help dialog, specific to the page.'),
  description: z.string().describe('A concise paragraph explaining the purpose of the page.'),
  actions: z.array(z.string()).describe('A list of key actions a user can perform on this page.'),
});
export type HelpContentOutput = z.infer<typeof HelpContentOutputSchema>;

export async function getHelpContent(input: HelpContentInput): Promise<HelpContentOutput> {
  return helpAssistantFlow(input);
}

const helpAssistantPrompt = ai.definePrompt({
  name: 'helpAssistantPrompt',
  input: { schema: HelpContentInputSchema },
  output: { schema: HelpContentOutputSchema },
  prompt: `You are a friendly and helpful AI assistant for a business management application called "Fineko".
Your role is to provide a brief, welcoming, and informative guide for the user about the page they are currently visiting.
The application uses Ukrainian language, so all your responses must be in Ukrainian.

Generate a title, a short description, and a list of key actions for the page identified by: '{{{pageName}}}'.

Example for 'tasks' page:
- Title: "Ласкаво просимо на сторінку Задач!"
- Description: "Тут ви можете керувати своїми щоденними задачами. Створюйте нові задачі, відстежуйте їх виконання та аналізуйте свою продуктивність."
- Actions: ["Створювати нові задачі", "Переглядати задачі на будь-який день", "Фільтрувати задачі (мої, делеговані, підлеглих)", "Редагувати деталі кожної задачі в бічній панелі"]

Now, generate the content for the '{{{pageName}}}' page.
`,
});

const helpAssistantFlow = ai.defineFlow(
  {
    name: 'helpAssistantFlow',
    inputSchema: HelpContentInputSchema,
    outputSchema: HelpContentOutputSchema,
  },
  async (input) => {
    const { output } = await helpAssistantPrompt(input);
    return output!;
  }
);
