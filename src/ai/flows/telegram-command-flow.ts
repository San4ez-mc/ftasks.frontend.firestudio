
'use server';
/**
 * @fileOverview An AI flow for parsing natural language commands from a Telegram bot.
 * This version decomposes complex commands into a sequence of simpler commands.
 *
 * - parseTelegramCommand - Analyzes user text and converts it into an array of structured command objects.
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
  prompt: `You are a command parser for a task management system. Your ONLY purpose is to convert user text into an array of JSON objects that strictly adhere to the provided output schema.

**RULES:**
1.  **Decompose Complex Commands:** If a user command requires multiple actions (e.g., creating a result AND adding sub-results), you MUST break it down into a sequence of simple commands in the output array.
2.  **Strict JSON Output:** Your entire output must be a single JSON array \`[]\`. Do NOT add any other text, comments, or fields like 'reply'.
3.  **Use Today's Date:** If a date is not specified for a task or query, use today's date from the context.
4.  **Handle "My"/"мої":** If the user refers to "my" tasks or results, use the dedicated commands \`view_my_tasks\` or \`view_my_results\`.
5.  **Clarify if Needed:** If a required parameter is missing (e.g., "create task for John" with no title), return an array with a single \`clarify\` command.

**CONTEXT:**
- Today's date is: ${new Date().toISOString().split('T')[0]}.
- Current user: {{json currentUser}}.
- Available employees: {{json employees}}.
- Available templates: {{json templates}}.
- Allowed commands: [{{#each allowedCommands}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}]

**User command:** "{{command}}"
`,
});


export async function parseTelegramCommand(input: TelegramCommandInput): Promise<TelegramCommandOutput[]> {
  // Handle 'help' keyword separately for simplicity and reliability
  const helpKeywords = ['допомога', 'допоможи', 'що ти вмієш', 'команди', 'help'];
  if (helpKeywords.some(kw => input.command.toLowerCase().includes(kw))) {
    return [{
        command: 'show_help',
        parameters: {},
        missingInfo: `Я вмію:\n- Створювати задачі та результати (включно з вкладеними).\n- Редагувати задачі (назву, статус, дату).\n- Додавати коментарі до задач та результатів.\n- Показувати списки задач, результатів, співробітників, шаблонів.`
    }];
  }
  
  const { output } = await commandParserPrompt(input);

  if (!output || output.length === 0) {
     return [{ command: 'unknown' }];
  }
  
  // The logic for 'мої' is now handled by dedicated commands (view_my_tasks, etc.)
  return output;
}
