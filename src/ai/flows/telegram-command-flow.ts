
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
  prompt: `You are a command classifier. Your only job is to identify the most likely command from the user's text and extract the entire raw text of the command.

**RULES:**
1.  **Strict JSON Output:** Your entire output must be a single JSON array \`[]\`. Do NOT add any other text or comments.
2.  **Extract Full Raw Text:** For ALL commands, you MUST copy the entire user's original command text into the 'text' field. Do not shorten or modify it.
3.  **Keywords for 'create_result':** The words 'ціль' or 'результат' STRONGLY and ALWAYS imply the 'create_result' command. Do not mistake it for 'create_task'.
4.  **Handle Ambiguity:** If a command is missing critical information (like a title for a task), return the 'clarify' command.
5.  **Handle "My"/"мої":** If the user refers to "my" tasks or results, use the dedicated commands \`view_my_tasks\` or \`view_my_results\`.
6.  **Correctly Choose View Commands:**
    - If the user asks for "my tasks" ("мої задачі") or "my results" ("мої результати"), you MUST use the \`view_my_tasks\` or \`view_my_results\` commands.
    - If the user asks for a general list like "show tasks" ("покажи задачі") or "list of results" ("список результатів") without specifying an owner, you MUST use the general \`view_tasks\` or \`view_results\` commands.

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
     return [{ command: 'unknown', text: input.command }];
  }
  
  return output;
}
