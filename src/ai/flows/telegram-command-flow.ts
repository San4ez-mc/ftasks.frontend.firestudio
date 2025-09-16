
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
  prompt: `You are a command parser for the Fineko task management system.
  
Your sole purpose is to convert the user's natural language command into a structured JSON object based on the provided output schema.

Analyze the user's command text ("command") and use the provided context to fill out the JSON fields.

**EXAMPLES OF CORRECT JSON OUTPUT:**

1.  User command: "Покажи мої невиконані задачі"
    JSON Output:
    {
      "command": "view_tasks",
      "parameters": {
        "assigneeName": "мої",
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
- Today's date is: ${new Date().toISOString().split('T')[0]}. Use this to resolve relative dates like "today" or "tomorrow".
- Available employees: {{json employees}}.
- Available templates: {{json templates}}.
- Current user: {{json currentUser}}.

**RULES:**
1.  If the command is clear, generate the corresponding JSON object.
2.  If the command is ambiguous or missing required information (e.g., "create task for John" with no title), set the command field to "clarify" and provide a question in the "missingInfo" field.
3.  If you cannot understand the command at all, set the command to "unknown" and provide a helpful reply.
4.  For 'create_result', correctly parse the nested structure of sub-results from the text.

**User command:** "{{command}}"
`,
});


export async function parseTelegramCommand(input: TelegramCommandInput): Promise<TelegramCommandOutput> {
  // Handle 'help' keyword separately for simplicity and reliability
  const helpKeywords = ['допомога', 'допоможи', 'що ти вмієш', 'команди', 'help'];
  if (helpKeywords.some(kw => input.command.toLowerCase().includes(kw))) {
    return {
        command: 'show_help',
        reply: `Я вмію:\n- Створювати задачі та результати (включно з вкладеними).\n- Редагувати задачі (назву, статус, дату).\n- Додавати коментарі до задач та результатів.\n- Показувати списки задач, результатів, співробітників, шаблонів.`
    };
  }
  
  const { output } = await commandParserPrompt(input);

  if (!output) {
     return { command: 'unknown', reply: "Я не зміг вас зрозуміти. Спробуйте сказати, що ви хочете зробити, наприклад: 'створи задачу', 'створи результат', або 'список співробітників'." };
  }
  
  // If the AI returns 'мої', replace it with the actual current user's name.
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
