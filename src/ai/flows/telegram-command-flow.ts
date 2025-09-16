
'use server';
/**
 * @fileOverview An AI flow for parsing natural language commands from a Telegram bot.
 * This version identifies the primary command and extracts the raw text for later processing.
 *
 * - parseTelegramCommand - Analyzes user text and converts it into an array of simplified command objects.
 */

import { ai } from '@/ai/genkit';
import {
  TelegramCommandInput,
  TelegramCommandInputSchema,
  TelegramCommandOutput,
  TelegramCommandListSchema,
} from '@/ai/types';


const commandParserPrompt = ai.definePrompt({
  name: 'telegramCommandParserPrompt',
  input: { schema: TelegramCommandInputSchema },
  output: { schema: TelegramCommandListSchema },
  prompt: `You are a command classifier. Your only job is to identify the most likely command from the user's text and extract the rest of the text.

**RULES:**
1.  **Strict JSON Output:** Your entire output must be a single JSON array \`[]\`. Do NOT add any other text or comments.
2.  **Identify the Best Command:** From the list of available commands, choose the ONE that best matches the user's intent.
3.  **Keywords:** The words 'ціль' or 'результат' strongly imply 'create_result'. The word 'задача' implies 'create_task'.
4.  **Extract Raw Text:** The 'text' parameter in your output should contain the rest of the user's command. For simple list commands (like "list employees" or "show results"), you MUST copy the entire user's command into the 'text' field.
5.  **Handle Ambiguity:** If the command is completely unclear, return an array with a single 'unknown' command.

**Available Commands:**
- create_task
- create_result
- list_employees
- view_tasks
- view_my_tasks
- view_results
- view_my_results
- edit_task_title
- add_comment_to_result
- add_comment_to_task
- view_task_details
- list_templates
- create_template
- update_task_status
- update_task_date
- show_help

**EXAMPLES:**

User command: "Створи задачу 'Підготувати звіт' для Марії на завтра"
Your JSON Output:
[{ "command": "create_task", "text": "'Підготувати звіт' для Марії на завтра" }]

User command: "Покажи мої невиконані задачі"
Your JSON Output:
[{ "command": "view_my_tasks", "text": "невиконані задачі" }]

User command: "список співробітників"
Your JSON Output:
[{ "command": "list_employees", "text": "список співробітників" }]
---
**CONTEXT:**
- Current user: {{json currentUser}}.
- Available employees: {{json employees}}.

**User command:** "{{command}}"
`,
});


export async function parseTelegramCommand(input: TelegramCommandInput): Promise<TelegramCommandOutput[]> {
  // Handle 'help' keyword separately for simplicity and reliability
  const helpKeywords = ['допомога', 'допоможи', 'що ти вмієш', 'команди', 'help'];
  if (helpKeywords.some(kw => input.command.toLowerCase().includes(kw))) {
    return [{
        command: 'show_help',
        text: `Я вмію:\n- Створювати задачі та результати (включно з вкладеними).\n- Редагувати задачі (назву, статус, дату).\n- Додавати коментарі до задач та результатів.\n- Показувати списки задач, результатів, співробітників, шаблонів.`
    }];
  }
  
  const { output } = await commandParserPrompt(input);

  if (!output || output.length === 0) {
     return [{ command: 'unknown' }];
  }
  
  return output;
}
