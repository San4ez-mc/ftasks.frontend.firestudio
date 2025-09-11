
'use server';
/**
 * @fileOverview An AI flow for parsing natural language commands from a Telegram bot.
 *
 * - parseTelegramCommand - Analyzes user text and determines the desired action and its parameters.
 * - TelegramCommandInput - The input type for the flow.
 * - TelegramCommandOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import {
  TelegramCommandInput,
  TelegramCommandOutput,
  TelegramCommandInputSchema,
  TelegramCommandOutputSchema,
} from '@/ai/types';


export async function parseTelegramCommand(input: TelegramCommandInput): Promise<TelegramCommandOutput> {
  return telegramCommandFlow(input);
}


const telegramCommandPrompt = ai.definePrompt({
  name: 'telegramCommandPrompt',
  input: { schema: TelegramCommandInputSchema },
  output: { schema: TelegramCommandOutputSchema },
  prompt: `You are an intelligent assistant for the Fineko task management system, processing commands from a Telegram chat.
Your goal is to understand the user's request in Ukrainian, extract parameters, and determine the correct action based on their permissions.

IMPORTANT: You MUST understand Ukrainian and ALWAYS reply in Ukrainian.

Available commands:
{{#each allowedCommands}}
- '{{this}}'
{{/each}}

Command details:
1.  'create_task': Creates a new daily task.
    - Required parameters: 'title'.
    - Optional parameters: 'assigneeName', 'dueDate'.
    - If 'assigneeName' is not provided, it defaults to the current user.
    - If 'dueDate' is not provided, it defaults to today.
2.  'create_result': Creates a new long-term result/goal.
    - Required parameters: 'title'.
    - Optional parameters: 'assigneeName', 'dueDate'.
3. 'view_tasks': View tasks for a specific date.
    - Optional parameters: 'assigneeName', 'dueDate'.
4.  'list_employees': Lists all employees in the company.
    - No parameters needed.
5.  'clarify': Use this command if you understand the user's intent but are missing required information.
6.  'unknown': Use this command if you cannot understand the user's intent at all.

Your task:
1.  Analyze the user's command in Ukrainian: "{{command}}".
2.  Identify which of the available commands from the 'allowedCommands' list the user wants to execute. If the user asks for a command not in their 'allowedCommands' list, respond that they do not have permission.
3.  Extract all relevant parameters ('title', 'assigneeName', 'dueDate').
    - The 'assigneeName' MUST EXACTLY MATCH one of the names in this list: {{#each employees}}"{{name}}"{{#unless @last}}, {{/unless}}{{/each}}. If a name is similar but not an exact match, ask for clarification.
    - Today's date is ${new Date().toISOString().split('T')[0]}. If the user says "завтра" or "сьогодні", calculate the correct date.
4.  If a required parameter for a command is missing, set the command to 'clarify' and formulate a clear question in the 'missingInfo' field IN UKRAINIAN. Example: "Для кого створити задачу?" or "Яка назва задачі?".
5.  If you cannot determine the intent, set the command to 'unknown' and provide a helpful message in the 'reply' field IN UKRAINIAN. Example: "Я не зміг вас зрозуміти. Спробуйте сказати, що ви хочете зробити, наприклад: 'створи задачу', 'створи результат', або 'список співробітників'."
6.  Return the result in the required JSON format.
`,
});


const telegramCommandFlow = ai.defineFlow(
  {
    name: 'telegramCommandFlow',
    inputSchema: TelegramCommandInputSchema,
    outputSchema: TelegramCommandOutputSchema,
  },
  async (input) => {
    const { output } = await telegramCommandFlow(input);
    return output!;
  }
);
