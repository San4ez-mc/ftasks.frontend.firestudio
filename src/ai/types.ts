import { z } from 'zod';

// From ai-task-prioritization.ts
export const TaskSchema = z.object({
  id: z.string(),
  description: z.string(),
  deadline: z.string().optional(), // Expects date as a string, e.g., '2024-12-31'
  isGoal: z.boolean().optional(),
});
export type Task = z.infer<typeof TaskSchema>;

export const TaskPrioritizationInputSchema = z.object({
  tasks: z.array(TaskSchema).describe('A list of tasks with descriptions and optional deadlines.'),
  overallGoal: z.string().describe('The user’s overall goal.'),
});
export type TaskPrioritizationInput = z.infer<typeof TaskPrioritizationInputSchema>;

export const TaskPrioritizationOutputSchema = z.array(
  z.object({
    taskId: z.string().describe('The ID of the task.'),
    priorityReason: z.string().describe('The reason for the suggested priority.'),
  })
);
export type TaskPrioritizationOutput = z.infer<typeof TaskPrioritizationOutputSchema>;

// From audit-summary-flow.ts
export const AuditSummaryInputSchema = z.object({
  currentSummary: z.string().describe('The summary generated so far from previous questions and answers.'),
  identifiedProblems: z.array(z.string()).describe('The list of problems identified so far.'),
  question: z.string().describe('The latest question that was asked.'),
  answer: z.string().describe('The answer provided by the user to the latest question.'),
});
export type AuditSummaryInput = z.infer<typeof AuditSummaryInputSchema>;

export const AuditSummaryOutputSchema = z.object({
  updatedSummary: z.string().describe('The updated, concise summary incorporating the new answer. It should be in Ukrainian.'),
  updatedProblems: z.array(z.string()).describe('The updated list of potential business problems or weaknesses identified. These should be actionable and clear. Formulate them in Ukrainian.'),
});
export type AuditSummaryOutput = z.infer<typeof AuditSummaryOutputSchema>;

// From telegram-command-flow.ts
const EmployeeSchema = z.object({
  id: z.string(),
  name: z.string().describe('The full name of the employee.'),
});

export const TelegramCommandInputSchema = z.object({
  command: z.string().describe('The natural language command from the user.'),
  employees: z.array(EmployeeSchema).describe('A list of available employees to assign tasks/results to.'),
  allowedCommands: z.array(z.string()).describe('A list of commands the user is permitted to execute.'),
});
export type TelegramCommandInput = z.infer<typeof TelegramCommandInputSchema>;

export const TelegramCommandOutputSchema = z.object({
  command: z.enum(['create_task', 'create_result', 'list_employees', 'view_tasks', 'unknown', 'clarify'])
    .describe('The recognized command the user wants to execute.'),
  parameters: z.object({
    title: z.string().optional().describe('The title for the task or result.'),
    assigneeName: z.string().optional().describe("The name of the employee to whom the task or result is assigned. Must be one of the names from the input employees list."),
    dueDate: z.string().optional().describe("The due date in 'YYYY-MM-DD' format."),
    // ... other parameters can be added here
  }).optional().describe('The parameters extracted from the command.'),
  missingInfo: z.string().optional().describe('A question to ask the user if some required information is missing for a command.'),
  reply: z.string().optional().describe('A direct reply to the user if the command is simple (like "list_employees") or unknown.'),
});
export type TelegramCommandOutput = z.infer<typeof TelegramCommandOutputSchema>;
