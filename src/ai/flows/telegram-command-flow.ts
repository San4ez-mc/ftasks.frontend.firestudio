
'use server';
/**
 * @fileOverview An AI flow for parsing natural language commands from a Telegram bot.
 *
 * - parseTelegramCommand - Analyzes user text and determines the desired action and its parameters.
 * - TelegramCommandInput - The input type for the flow.
 * - TelegramCommandOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const EmployeeSchema = z.object({
  id: z.string(),
  name: z.string().describe('The full name of the employee.'),
});

export const TelegramCommandInputSchema = z.object({
  command: z.string().describe('The natural language command from the user.'),
  employees: z.array(EmployeeSchema).describe('A list of available employees to assign tasks/results to.'),
});
export type TelegramCommandInput = z.infer<typeof TelegramCommandInputSchema>;

export const TelegramCommandOutputSchema = z.object({
  command: z.enum(['create_task', 'create_result', 'list_employees', 'unknown', 'clarify'])
    .describe('The recognized command the user wants to execute.'),
  parameters: z.object({
    title: z.string().optional().describe('The title for the task or result.'),
    assigneeName: z.string().optional().describe("The name of the employee to whom the task or result is assigned. Must be one of the names from the input employees list."),
    dueDate: z.string().optional().describe("The due date in 'YYYY-MM-DD' format."),
    // ... other parameters can be added here
  }).optional().describe('The parameters extracted from the command.'),
  missingInfo: z.string().optional().describe('A question to ask the user if some required information is missing for a command.'),
  reply: z.string().optional().describe('A direct reply to the user if the command is simple (like "list_employees") or unknown.'),
});
export type TelegramCommandOutput = z.infer<typeof TelegramCommandOutputSchema>;


export async function parseTelegramCommand(input: TelegramCommandInput): Promise<TelegramCommandOutput> {
  return telegramCommandFlow(input);
}


const telegramCommandPrompt = ai.definePrompt({
  name: 'telegramCommandPrompt',
  input: { schema: TelegramCommandInputSchema },
  output: { schema: TelegramCommandOutputSchema },
  prompt: `You are an intelligent assistant for the Fineko task management system, processing commands from a Telegram chat.
Your goal is to understand the user's request, extract parameters, and determine the correct action.

Available commands:
1.  'create_task': Creates a new daily task.
    - Required parameters: 'title'.
    - Optional parameters: 'assigneeName', 'dueDate'.
    - If 'assigneeName' is not provided, it defaults to the current user.
    - If 'dueDate' is not provided, it defaults to today.
2.  'create_result': Creates a new long-term result/goal.
    - Required parameters: 'title'.
    - Optional parameters: 'assigneeName', 'dueDate'.
3.  'list_employees': Lists all employees in the company.
    - No parameters needed.
4.  'clarify': Use this command if you understand the user's intent but are missing required information.
5.  'unknown': Use this command if you cannot understand the user's intent at all.

Your task:
1.  Analyze the user's command: "{{command}}".
2.  Identify which of the available commands the user wants to execute.
3.  Extract all relevant parameters ('title', 'assigneeName', 'dueDate').
    - The 'assigneeName' MUST EXACTLY MATCH one of the names in this list: {{#each employees}}"{{name}}"{{#unless @last}}, {{/unless}}{{/each}}. If a name is similar but not an exact match, ask for clarification.
    - Today's date is ${new Date().toISOString().split('T')[0]}. If the user says "tomorrow", calculate the correct date.
4.  If a required parameter for a command is missing, set the command to 'clarify' and formulate a clear question in the 'missingInfo' field.
5.  If the command is 'list_employees', set the 'reply' field with a confirmation message. You don't need to list them, the system will do that.
6.  If you cannot determine the intent, set the command to 'unknown' and provide a helpful message in the 'reply' field.
7.  Return the result in the required JSON format.
`,
});


const telegramCommandFlow = ai.defineFlow(
  {
    name: 'telegramCommandFlow',
    inputSchema: TelegramCommandInputSchema,
    outputSchema: TelegramCommandOutputSchema,
  },
  async (input) => {
    const { output } = await telegramCommandPrompt(input);
    return output!;
  }
);
