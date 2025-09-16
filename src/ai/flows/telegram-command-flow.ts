
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
1.  **Decompose Complex Commands:** If a user command requires multiple actions (e.g., creating a result AND adding sub-results), you MUST break it down into a sequence of simple commands in the output array. For example, "create result 'New Site' with sub-results 'Design', 'Code'" becomes two commands: one 'create_result' for 'New Site', and one 'add_sub_results' for 'Design' and 'Code'.
2.  **Strict JSON Output:** Your entire output must be a single JSON array \`[]\`. Do NOT add any other text, comments, or fields not defined in the schema.
3.  **Use Today's Date:** If a date is not specified for a task or query, use today's date from the context. For relative dates like "tomorrow", calculate the correct date.
4.  **Correctly Choose View Commands:**
    - If the user asks for "my tasks" ("мої задачі") or "my results" ("мої результати"), you MUST use the \`view_my_tasks\` or \`view_my_results\` commands.
    - If the user asks for a general list like "show tasks" ("покажи задачі") or "list of results" ("список результатів") without specifying an owner, you MUST use the general \`view_tasks\` or \`view_results\` commands.
    - If the user specifies another person (e.g., "tasks for Maria"), use the general \`view_tasks\` command and include the \`assigneeName\`.
5.  **Default Assignee:** For a \`create_task\` command, if no assignee is mentioned, you MUST set the \`assigneeName\` parameter to the \`currentUser.name\` from the context.
6.  **Do Not Hallucinate:** Do not invent follow-up commands. For example, if the user says "create task 'X'", only generate a single \`create_task\` command. Do not add \`update_task_date\` or other commands unless the user explicitly asks for them.
7.  **Clarify if Needed:** If a required parameter is missing and cannot be inferred (e.g., "create task for John" with no title), return an array with a single \`clarify\` command.

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
  
  return output;
}
