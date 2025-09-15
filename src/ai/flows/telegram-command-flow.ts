
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
  TelegramCommandOutput,
  TelegramCommandInputSchema,
  TelegramCommandOutputSchema,
} from '@/ai/types';
import { z } from 'zod';

// Define tools for each possible user action. The AI will choose which of these to call.

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
  async (input) => {
    // The tool's job is just to format the output for the webhook.
    // The actual database operation happens in the webhook itself.
    return { command: 'create_task', parameters: input };
  }
);

const createResultTool = ai.defineTool(
  {
    name: 'create_result',
    description: 'Створює новий довгостроковий результат або ціль.',
     inputSchema: z.object({
      title: z.string().describe("Назва результату, яку потрібно створити."),
      assigneeName: z.string().optional().describe("Ім'я співробітника, якому призначається результат."),
      dueDate: z.string().optional().describe("Дедлайн для результату у форматі 'YYYY-MM-DD'."),
    }),
    outputSchema: TelegramCommandOutputSchema,
  },
  async (input) => {
    return { command: 'create_result', parameters: input };
  }
);

const viewTasksTool = ai.defineTool(
  {
    name: 'view_tasks',
    description: 'Переглядає задачі на певну дату для певного співробітника.',
    inputSchema: z.object({
      assigneeName: z.string().optional().describe("Ім'я співробітника, чиї задачі потрібно переглянути."),
      dueDate: z.string().optional().describe("Дата для перегляду завдань у форматі 'YYYY-MM-DD'."),
    }),
    outputSchema: TelegramCommandOutputSchema,
  },
   async (input) => {
    return { command: 'view_tasks', parameters: input };
  }
);

const listEmployeesTool = ai.defineTool(
  {
    name: 'list_employees',
    description: 'Показує список всіх співробітників у компанії.',
    inputSchema: z.object({}),
    outputSchema: TelegramCommandOutputSchema,
  },
  async () => {
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
  async (input) => {
    return { command: 'edit_task_title', parameters: input };
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
  async (input) => {
    return { command: 'add_comment_to_result', parameters: input };
  }
);


export async function parseTelegramCommand(input: TelegramCommandInput): Promise<TelegramCommandOutput> {
  // Check if user is asking for help
  const helpKeywords = ['допомога', 'допоможи', 'що ти вмієш', 'команди', 'help'];
  if (helpKeywords.some(kw => input.command.toLowerCase().includes(kw))) {
    return {
        command: 'show_help',
        reply: `Я вмію:\n- Створювати задачі: 'створи задачу [назва] для [ім'я] на [дата]'.\n- Створювати результати.\n- Редагувати задачі: 'зміни задачу [стара назва] на [нова назва]'.\n- Додавати коментарі до результатів.\n- Показувати список співробітників.`
    };
  }
  
  // Define the main agent prompt that will use the tools.
  const telegramAgent = ai.definePrompt({
    name: 'telegramAgent',
    system: `Ти — інтелектуальний асистент для системи керування задачами Fineko. Твоє завдання — зрозуміти запит користувача українською мовою та викликати відповідний інструмент для його виконання.

Важливі правила:
1.  Сьогоднішня дата: ${new Date().toISOString().split('T')[0]}. Використовуй її для розрахунку відносних дат, таких як "сьогодні" або "завтра".
2.  При виклику інструментів, що вимагають 'assigneeName', це ім'я ПОВИННО ТОЧНО збігатися з одним із імен у списку: ${input.employees.map(e => `"${e.name}"`).join(', ')}.
3.  Якщо ти не впевнений, яке ім'я використовувати, або воно не збігається, не викликай інструмент. Замість цього дай відповідь з уточнюючим питанням.
4.  Якщо ти не можеш зрозуміти намір користувача або жоден інструмент не підходить, дай відповідь з повідомленням про помилку.
5.  Завжди відповідай українською мовою.`,
    tools: [
        createTaskTool,
        createResultTool,
        viewTasksTool,
        listEmployeesTool,
        editTaskTitleTool,
        addCommentToResultTool
    ],
  });

  const { output } = await telegramAgent({
    prompt: input.command,
  });

  if (!output) {
     return { command: 'unknown', reply: "Я не зміг вас зрозуміти. Спробуйте сказати, що ви хочете зробити, наприклад: 'створи задачу', 'створи результат', або 'список співробітників'." };
  }
  
  // Check if the output is a tool call
  if (output.isToolCall()) {
    const toolCall = output.toolCalls[0];
    const tool = ai.lookupTool(toolCall.toolName);
    const toolOutput = await tool(toolCall.args);
    return toolOutput;
  }

  // Check if the output is text (clarification or error)
  if (output.isText()) {
    // If the model asks a question, it's a clarification.
    if (output.text.includes('?')) {
        return { command: 'clarify', missingInfo: output.text };
    }
    // Otherwise, it's an unknown command.
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

    