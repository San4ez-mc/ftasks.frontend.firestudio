
'use server';
/**
 * @fileOverview An AI flow for parsing natural language commands from a Telegram bot using a structured prompt.
 *
 * - parseTelegramCommand - Analyzes user text and converts it into a structured command object.
 * - TelegramCommandInput - The input type for the flow.
 * - TelegramCommandOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import {
  TelegramCommandInput,
  TelegramCommandInputSchema,
  TelegramCommandOutput,
  TelegramCommandOutputSchema,
} from '@/ai/types';

const commandParserPrompt = ai.definePrompt({
  name: 'telegramCommandParserPrompt',
  input: { schema: TelegramCommandInputSchema },
  output: { schema: TelegramCommandOutputSchema },
  prompt: `You are a command parser for the Fineko task management system. Your ONLY purpose is to convert user text into a JSON object that strictly adheres to the provided output schema.

**RULES:**
1.  Analyze the user's command text.
2.  Use the provided context (current date, employee list, current user) to fill the JSON fields correctly.
3.  If required information is missing for a command (e.g., "create task for John" with no title), you MUST set the command field to "clarify" and provide a clear question in the "missingInfo" field.
4.  Your output MUST be ONLY the JSON object and nothing else. Do NOT add any other text, comments, or fields like 'reply'.
5.  Accurately parse nested sub-results based on the provided schema.

**CONTEXT:**
- Today's date is: ${new Date().toISOString().split('T')[0]}. Use this to resolve relative dates like "today", "tomorrow", or when no date is specified for a task/result query.
- Current user: {{json currentUser}}. Use this when the user says "my" or "мої".
- Available employees: {{json employees}}.
- Available templates: {{json templates}}.

**User command:** "{{command}}"
`,
});


export async function parseTelegramCommand(input: TelegramCommandInput): Promise<TelegramCommandOutput> {
  // Handle 'help' keyword separately for simplicity and reliability
  const helpKeywords = ['допомога', 'допоможи', 'що ти вмієш', 'команди', 'help'];
  if (helpKeywords.some(kw => input.command.toLowerCase().includes(kw))) {
    return {
        command: 'show_help',
        parameters: {},
        missingInfo: `Я вмію:\n- Створювати задачі та результати (включно з вкладеними).\n- Редагувати задачі (назву, статус, дату).\n- Додавати коментарі до задач та результатів.\n- Показувати списки задач, результатів, співробітників, шаблонів.`
    };
  }
  
  const { output } = await commandParserPrompt(input);

  if (!output) {
     return { command: 'unknown' };
  }
  
  // Post-processing to resolve 'мої' to the current user's name
  if (output.parameters?.assigneeName === 'мої') {
      output.parameters.assigneeName = input.currentUser.name;
  }
  
  return output;
}


const telegramCommandFlow = ai.defineFlow(
  {
    name: 'telegramCommandFlow',
    inputSchema: TelegramCommandInputSchema,
    outputSchema: TelegramCommandOutputSchema,
  },
  async (input) => {
    return parseTelegramCommand(input);
  }
);
