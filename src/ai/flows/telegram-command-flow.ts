
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
  prompt: `You are a command parser for the Fineko task management system. Your ONLY purpose is to convert user text into a JSON object that strictly adheres to the provided output schema. DO NOT add any other text, comments, or fields like 'reply'.

**EXAMPLES OF CORRECT JSON OUTPUT:**

1.  User command: "Покажи мої невиконані задачі"
    JSON Output:
    {
      "command": "view_my_tasks",
      "parameters": {
        "status": "todo",
        "startDate": "${new Date().toISOString().split('T')[0]}",
        "endDate": "${new Date().toISOString().split('T')[0]}"
      }
    }

2.  User command: "ціль Підготувати квартальний звіт, підрезультати Зібрати дані, Створити презентацію. в Зібрати дані є підпункти аналітика з GA, дані з CRM"
    JSON Output:
    {
      "command": "create_result",
      "parameters": {
        "title": "Підготувати квартальний звіт",
        "subResults": [
          {
            "name": "Зібрати дані",
            "subResults": [
              { "name": "аналітика з GA" },
              { "name": "дані з CRM" }
            ]
          },
          { "name": "Створити презентацію" }
        ]
      }
    }

**CONTEXT:**
- Today's date is: ${new Date().toISOString().split('T')[0]}. Use this to resolve relative dates like "today", "tomorrow", or when no date is specified for a task/result query.
- Current user: {{json currentUser}}.
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
