
'use server';
/**
 * @fileOverview An AI flow for parsing natural language commands from a Telegram bot.
 * This version identifies the primary command, extracts the raw text, and identifies the assignee if mentioned.
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
  prompt: `You are a command classifier and entity extractor for a task management system. Your job is to identify the command, extract the entire raw text, and identify the assignee.

**RULES:**
1.  **Strict JSON Output:** Your entire output must be a single JSON array \`[]\`. Do NOT add any other text or comments.
2.  **Keyword Priority for 'create_template':** The word 'шаблон' (template) STRONGLY and ALWAYS implies the 'create_template' command. Do not mistake it for 'create_task'.
3.  **Keywords Priority for 'create_result':** The words 'ціль' or 'результат' STRONGLY and ALWAYS imply the 'create_result' command. Do not mistake it for 'create_task'.
4.  **Extract Full Raw Text:** For ALL commands, you MUST copy the entire user's original command text into the 'text' field. Do not shorten or modify it.
5.  **Assignee Extraction:** Analyze the text for employee names from the provided list. If a name is mentioned in context of being an assignee (e.g., "для Петра", "виконавець Петро"), you MUST extract their 'id' and put it in the 'assigneeId' field. If no employee is mentioned, or if the user is referring to themselves ("мої задачі"), omit the 'assigneeId' field.
6.  **Handle Ambiguity:** If a command is missing critical information (like a title for a task, e.g., "Створити задачу для Петра"), return the 'clarify' command.
7.  **Viewing Other's Tasks:** If the user asks for tasks of a specific person (e.g., "які задачі у Петра"), it is a 'view_tasks' command, and you MUST extract their ID into the 'assigneeId' field.
8.  **Clean Task Title:** When creating a task, if a time like "о 15:00" is mentioned, EXCLUDE it from the task title you extract.

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
        text: `
*Доступні команди:*

*Задачі*
- *Створити:* \`створи задачу "Написати звіт" для Петра на завтра о 14:00\`
- *Переглянути:* \`покажи мої задачі\` або \`задачі Марії на сьогодні\`

*Результати*
- *Створити:* \`створи результат "Запустити сайт" з підпунктами: дизайн, розробка\`
- *Переглянути:* \`покажи всі результати\`

*Шаблони*
- *Створити:* \`створи шаблон "Щоденний мітинг"\`
- *Переглянути:* \`список шаблонів\`

*Команда*
- *Переглянути:* \`список співробітників\`

Я розпізнаю імена, дати (сьогодні, завтра, 25.09) та час.
        `
    }];
  }
  
  const { output } = await commandParserPrompt(input);

  if (!output || output.length === 0) {
     return [{ command: 'unknown', text: input.command }];
  }
  
  return output;
}
