
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
  prompt: `Ти — просунутий парсер команд для системи керування задачами Fineko.
  
Твоя єдина мета — перетворити текст користувача на структурований JSON-об'єкт, який точно відповідає наданій вихідній схемі (output schema).

Проаналізуй текст команди користувача ("command") та використай наданий контекст для правильного заповнення полів JSON.

**Контекст:**
- Сьогоднішня дата: ${new Date().toISOString().split('T')[0]}. Використовуй її для розрахунку відносних дат, таких як "сьогодні" або "завтра".
- Доступні співробітники: {{json employees}}. Використовуй ці імена для поля 'assigneeName'.
- Доступні шаблони: {{json templates}}.

**Правила обробки:**
1.  **Чітка команда:** Якщо команда ясна, згенеруй відповідний JSON-об'єкт з командою та параметрами.
2.  **Неоднозначність:** Якщо команда неповна або неоднозначна (наприклад, "створи задачу для Петра" без назви), встанови поле "command" в "clarify" і сформулюй уточнююче питання в полі "missingInfo".
3.  **Невідома команда:** Якщо ти зовсім не можеш зрозуміти команду, встанови поле "command" в "unknown" і надай корисну відповідь у полі "reply".
4.  **Вкладеність:** Для команди 'create_result' правильно розпізнавай вкладену структуру підрезультатів з тексту. Наприклад: "ціль А, підрезультати Б, В. в Б є підпункти Б1, Б2" -> { title: "А", subResults: [{ name: "Б", subResults: [{name: "Б1"}, {name: "Б2"}] }, { name: "В" }] }.

**Команда користувача:** "{{command}}"
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
