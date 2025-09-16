
'use server';
/**
 * @fileOverview An AI flow for parsing natural language commands from a Telegram bot using a tool-based agent.
 *
 * - parseTelegramCommand - Analyzes user text and determines the desired action and its parameters by selecting the appropriate tool.
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
import { z, type ZodType } from 'zod';

// --- Tool Schemas ---

const CreateResultInputSchema = z.object({
      title: z.string().describe("Основна назва результату/цілі."),
      subResults: z.any().optional().describe("Масив вкладених підрезультатів. Модель повинна сама розпізнати вкладену структуру з тексту. Наприклад, для 'ціль А, підрезультати Б, В. в Б є Б1, Б2' значення має бути [{ name: 'Б', subResults: [{name: 'Б1'}, {name: 'Б2'}] }, { name: 'В' }]"),
      assigneeName: z.string().optional().describe("Ім'я співробітника, якому призначається результат."),
      dueDate: z.string().optional().describe("Дедлайн для результату у форматі 'YYYY-MM-DD'."),
    });


// --- Tool Definitions ---

const createTaskTool = ai.defineTool(
  {
    name: 'create_task',
    description: 'Створює нове щоденне завдання для співробітника.',
    inputSchema: z.object({
      title: z.string().describe("Назва завдання, яку потрібно створити."),
      assigneeName: z.string().optional().describe("Ім'я співробітника, якому призначається завдання. Має ТОЧНО відповідати одному з наданих імен співробітників."),
      dueDate: z.string().optional().describe("Дата виконання завдання у форматі 'YYYY-MM-DD'."),
    }),
    outputSchema: TelegramCommandOutputSchema,
  },
  async (input): Promise<TelegramCommandOutput> => {
    return { command: 'create_task', parameters: input };
  }
);

const createResultTool = ai.defineTool(
  {
    name: 'create_result',
    description: `Створює новий довгостроковий результат або ціль, можливо з вкладеними підрезультатами. 
Правильно парсить структуру. 
Приклад 1: "ціль А, підрезультати Б, В". Результат: { title: "А", subResults: [{ name: "Б" }, { name: "В" }] }.
Приклад 2: "ціль А, підрезультати Б, В. в Б є Б1, Б2". Результат: { title: "А", subResults: [{ name: "Б", subResults: [{name: "Б1"}, {name: "Б2"}] }, { name: "В" }] }.`,
    inputSchema: CreateResultInputSchema,
    outputSchema: TelegramCommandOutputSchema,
  },
  async (input): Promise<TelegramCommandOutput> => {
    return { command: 'create_result', parameters: input };
  }
);

const viewTasksTool = ai.defineTool(
  {
    name: 'view_tasks',
    description: "Переглядає задачі на певну дату або діапазон дат для певного співробітника, можливо з фільтром по статусу.",
    inputSchema: z.object({
      assigneeName: z.string().optional().describe("Ім'я співробітника, чиї задачі потрібно переглянути. Якщо 'мої', то це поточний користувач."),
      startDate: z.string().optional().describe("Початкова дата для перегляду завдань у форматі 'YYYY-MM-DD'."),
      endDate: z.string().optional().describe("Кінцева дата для перегляду завдань у форматі 'YYYY-MM-DD'."),
      status: z.enum(['todo', 'done']).optional().describe("Статус задач для фільтрації: 'todo' (в роботі) або 'done' (виконано)."),
    }),
    outputSchema: TelegramCommandOutputSchema,
  },
   async (input): Promise<TelegramCommandOutput> => {
    return { command: 'view_tasks', parameters: input };
  }
);

const viewResultsTool = ai.defineTool(
  {
    name: 'view_results',
    description: "Переглядає довгострокові результати для певного співробітника, можливо з фільтром по статусу.",
    inputSchema: z.object({
      assigneeName: z.string().optional().describe("Ім'я співробітника, чиї результати потрібно переглянути. Якщо 'мої', то це поточний користувач."),
      status: z.string().optional().describe("Статус результатів для фільтрації (наприклад, 'В роботі', 'Виконано')."),
    }),
    outputSchema: TelegramCommandOutputSchema,
  },
  async (input): Promise<TelegramCommandOutput> => {
    return { command: 'view_results', parameters: input };
  }
);


const viewTaskDetailsTool = ai.defineTool(
  {
    name: 'view_task_details',
    description: 'Показує детальну інформацію про конкретну задачу, знайдену за її назвою.',
    inputSchema: z.object({
      title: z.string().describe("Назва задачі, деталі якої потрібно показати."),
    }),
    outputSchema: TelegramCommandOutputSchema,
  },
  async (input): Promise<TelegramCommandOutput> => {
    return { command: 'view_task_details', parameters: input };
  }
);

const listEmployeesTool = ai.defineTool(
  {
    name: 'list_employees',
    description: 'Показує список всіх співробітників у компанії.',
    inputSchema: z.object({}),
    outputSchema: TelegramCommandOutputSchema,
  },
  async (): Promise<TelegramCommandOutput> => {
    return { command: 'list_employees' };
  }
);


const editTaskTitleTool = ai.defineTool(
  {
    name: 'edit_task_title',
    description: 'Змінює назву існуючого завдання.',
    inputSchema: z.object({
      targetTitle: z.string().describe("Поточна назва завдання, яку потрібно змінити."),
      newTitle: z.string().describe("Нова назва завдання."),
    }),
    outputSchema: TelegramCommandOutputSchema,
  },
  async (input): Promise<TelegramCommandOutput> => {
    return { command: 'edit_task_title', parameters: input };
  }
);

const addCommentToTaskTool = ai.defineTool(
  {
    name: 'add_comment_to_task',
    description: 'Додає коментар до щоденної задачі.',
    inputSchema: z.object({
      targetTitle: z.string().describe("Назва задачі, до якої додається коментар."),
      commentText: z.string().describe("Текст коментаря."),
    }),
    outputSchema: TelegramCommandOutputSchema,
  },
  async (input): Promise<TelegramCommandOutput> => {
    return { command: 'add_comment_to_task', parameters: input };
  }
);


const addCommentToResultTool = ai.defineTool(
  {
    name: 'add_comment_to_result',
    description: 'Додає коментар до довгострокового результату/цілі.',
    inputSchema: z.object({
      targetTitle: z.string().describe("Назва результату, до якого додається коментар."),
      commentText: z.string().describe("Текст коментаря."),
    }),
    outputSchema: TelegramCommandOutputSchema,
  },
  async (input): Promise<TelegramCommandOutput> => {
    return { command: 'add_comment_to_result', parameters: input };
  }
);

const updateTaskStatusTool = ai.defineTool(
  {
    name: 'update_task_status',
    description: "Змінює статус задачі (наприклад, позначає її виконаною).",
    inputSchema: z.object({
      targetTitle: z.string().describe("Назва задачі, статус якої потрібно змінити."),
      status: z.enum(['todo', 'done']).describe("Новий статус: 'todo' (в роботі) або 'done' (виконано)."),
    }),
    outputSchema: TelegramCommandOutputSchema,
  },
  async (input): Promise<TelegramCommandOutput> => {
    return { command: 'update_task_status', parameters: input };
  }
);

const updateTaskDateTool = ai.defineTool(
  {
    name: 'update_task_date',
    description: "Переносить задачу на іншу дату.",
    inputSchema: z.object({
      targetTitle: z.string().describe("Назва задачі, яку потрібно перенести."),
      newDueDate: z.string().describe("Нова дата виконання у форматі 'YYYY-MM-DD'."),
    }),
    outputSchema: TelegramCommandOutputSchema,
  },
  async (input): Promise<TelegramCommandOutput> => {
    return { command: 'update_task_date', parameters: input };
  }
);

const listTemplatesTool = ai.defineTool(
  {
    name: 'list_templates',
    description: "Показує список доступних шаблонів задач.",
    inputSchema: z.object({}),
    outputSchema: TelegramCommandOutputSchema,
  },
  async (): Promise<TelegramCommandOutput> => {
    return { command: 'list_templates' };
  }
);

const createTemplateTool = ai.defineTool(
  {
    name: 'create_template',
    description: "Створює новий шаблон для автоматичної генерації задач.",
    inputSchema: z.object({
      title: z.string().describe("Назва для нового шаблону."),
      repeatability: z.string().describe("Правило повторення, наприклад 'щоденно', 'щотижня'."),
    }),
    outputSchema: TelegramCommandOutputSchema,
  },
  async (input): Promise<TelegramCommandOutput> => {
    return { command: 'create_template', parameters: input };
  }
);

const clarifyTool = ai.defineTool(
  {
      name: 'clarify',
      description: 'Використовуй цей інструмент, якщо для виконання команди не вистачає обов\'язкової інформації. Постав користувачу уточнююче питання.',
      inputSchema: z.object({
          question: z.string().describe("Конкретне питання до користувача, щоб отримати відсутню інформацію."),
      }),
      outputSchema: TelegramCommandOutputSchema,
  },
  async (input): Promise<TelegramCommandOutput> => {
      return { command: 'clarify', missingInfo: input.question };
  }
);

const allTools = [
    createTaskTool,
    createResultTool,
    viewTasksTool,
    viewResultsTool,
    viewTaskDetailsTool,
    listEmployeesTool,
    editTaskTitleTool,
    addCommentToTaskTool,
    addCommentToResultTool,
    updateTaskStatusTool,
    updateTaskDateTool,
    listTemplatesTool,
    createTemplateTool,
    clarifyTool,
];

export async function parseTelegramCommand(input: TelegramCommandInput): Promise<TelegramCommandOutput> {
  // Check if user is asking for help
  const helpKeywords = ['допомога', 'допоможи', 'що ти вмієш', 'команди', 'help'];
  if (helpKeywords.some(kw => input.command.toLowerCase().includes(kw))) {
    return {
        command: 'show_help',
        reply: `Я вмію:\n- Створювати задачі та результати (включно з вкладеними).\n- Редагувати задачі (назву, статус, дату).\n- Додавати коментарі до задач та результатів.\n- Показувати списки задач, результатів, співробітників, шаблонів.`
    };
  }
  
  const systemPrompt = `Ти — агент-парсер команд для системи керування задачами Fineko. Твоя єдина мета — перетворити текст користувача на виклик одного з доступних інструментів.

**СУВОРІ ПРАВИЛА:**
1.  **ЗАВЖДИ ВИКЛИКАЙ ІНСТРУМЕНТ:** Твоя відповідь **ЗАВЖДИ** має бути викликом одного з інструментів.
2.  **НЕ ВІДПОВІДАЙ НАПРЯМУ:** Ніколи не відповідай користувачу розмовним текстом. Якщо користувач просить "покажи мої задачі", ти **ЗОБОВ'ЯЗАНИЙ** викликати інструмент \`view_tasks\`, а не писати список задач у відповідь.
3.  **УТОЧНЮЙ, ЯКЩО НЕ ВИСТАЧАЄ ДАНИХ:** Якщо для виклику інструмента не вистачає обов'язкових параметрів (наприклад, команда "створи задачу" без назви), **ЗАВЖДИ** використовуй інструмент \`clarify\`, щоб поставити уточнююче питання.
4.  **СЬОГОДНІШНЯ ДАТА:** ${new Date().toISOString().split('T')[0]}. Використовуй її для розрахунку дат ("сьогодні", "завтра").
5.  **КОНТЕКСТ:** Використовуй надані списки співробітників та шаблонів для точного заповнення параметрів. Імена мають збігатися.

**Твоє завдання:** Проаналізуй запит і виклич відповідний інструмент.`;
  
  const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      system: systemPrompt,
      prompt: input.command,
      tools: allTools,
  });

  const output = response.output;

  if (!output) {
     return { command: 'unknown', reply: "Я не зміг вас зрозуміти. Спробуйте сказати, що ви хочете зробити, наприклад: 'створи задачу', 'створи результат', або 'список співробітників'." };
  }
  
  // Check if the output is a tool call
  if (output.isToolCall()) {
    const toolCall = output.toolCalls[0];
    const tool = allTools.find(t => t.name === toolCall.toolName);
    if (tool) {
        const toolOutput = await tool(toolCall.args);
        return toolOutput;
    }
     return { command: 'unknown', reply: `Помилка: інструмент '${toolCall.toolName}' не знайдено.` };
  }

  // Check if the output is text (clarification or error)
  if (output.isText()) {
    return { command: 'unknown', reply: output.text };
  }

  // Fallback for any other case
  return { command: 'unknown', reply: "Я не зміг вас зрозуміти. Спробуйте сказати, що ви хочете зробити, наприклад: 'створи задачу', 'створи результат', або 'список співробітників'." };
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

    