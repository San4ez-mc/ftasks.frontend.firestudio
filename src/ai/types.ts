
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
  command: z.enum(['create_task', 'create_result', 'list_employees', 'view_tasks', 'edit_task_title', 'add_comment_to_result', 'show_help', 'unknown', 'clarify'])
    .describe('The recognized command the user wants to execute.'),
  parameters: z.object({
    title: z.string().optional().describe('The title for the new task or result.'),
    assigneeName: z.string().optional().describe("The name of the employee to whom the task or result is assigned. Must be one of the names from the input employees list."),
    dueDate: z.string().optional().describe("The due date in 'YYYY-MM-DD' format."),
    targetTitle: z.string().optional().describe('The title of the existing task or result to modify.'),
    newTitle: z.string().optional().describe('The new title for the task being edited.'),
    commentText: z.string().optional().describe('The text of the comment to add to a result.'),
  }).optional().describe('The parameters extracted from the command.'),
  missingInfo: z.string().optional().describe('A question to ask the user if some required information is missing for a command.'),
  reply: z.string().optional().describe('A direct reply to the user if the command is simple (like "list_employees", "show_help") or unknown.'),
});
export type TelegramCommandOutput = z.infer<typeof TelegramCommandOutputSchema>;


// From conversational-audit-flow.ts

export const ConversationTurnSchema = z.object({
    role: z.enum(['user', 'model']),
    text: z.string()
});
export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;


export const AuditStructureSchema = z.object({
  companyProfile: z.object({
    description: z.string().describe("What the company does."),
    products: z.array(z.string()).describe("List of products or services."),
    mainBusinessProcess: z.string().describe("The main business process."),
  }).optional(),
  team: z.object({
    employeeCount: z.number().describe("Total number of employees.").optional(),
    roles: z.array(z.object({
      employeeName: z.string(),
      role: z.string().describe("Role in the main process."),
      otherDuties: z.string().optional()
    })).describe("Employee roles.").optional(),
  }).optional(),
  ownerAnalysis: z.object({
    tasks: z.array(z.string()).describe("Detailed list of tasks the owner performs."),
    delegationAttempts: z.string().describe("Has the owner tried to delegate core product/service tasks?"),
  }).optional(),
  marketing: z.object({
    leadSource: z.string().describe("Main source of leads (e.g., word-of-mouth, ads)."),
    isLeadFlowManaged: z.boolean().describe("Is the lead flow managed and predictable?"),
    metrics: z.object({
      isLeadCostCalculated: z.boolean(),
      otherMetrics: z.array(z.string()),
    }),
    leadTrackingSystem: z.string().describe("CRM, spreadsheet, or none."),
  }).optional(),
  sales: z.object({
    mainSalesperson: z.string().describe("Who makes the main sales (owner, manager, etc.)."),
    processDescription: z.string(),
    hasScripts: z.boolean(),
    crmSystem: z.string().describe("Is a CRM used? If so, which one?"),
  }).optional(),
  finance: z.object({
    profitUnderstanding: z.string().describe("How well do they understand their profit?"),
    financialReports: z.array(z.enum(["P&L", "Cash Flow", "Balance Sheet"])),
    isBudgetSeparated: z.boolean().describe("Is the owner's budget separate from the business budget?"),
    systemsUsed: z.string().describe("Software or systems used for financial tracking."),
    productProfitability: z.string().describe("Do they calculate profitability for individual products/projects?"),
  }).optional(),
  production: z.object({
    mainProvider: z.string().describe("Who provides the main service or creates the product."),
  }).optional(),
}).describe("A structured summary of the business audit.").default({});
export type AuditStructure = z.infer<typeof AuditStructureSchema>;


export const ConversationalAuditInputSchema = z.object({
    userAudioDataUri: z.string().describe("A chunk of the user's spoken answer, as a data URI that must include a MIME type and use Base64 encoding."),
    conversationHistory: z.array(ConversationTurnSchema),
    currentSummary: AuditStructureSchema,
    auditId: z.string(),
});
export type ConversationalAuditInput = z.infer<typeof ConversationalAuditInputSchema>;

export const ConversationalAuditOutputSchema = z.object({
    aiResponseText: z.string().describe("The AI's next question or statement to the user."),
    userTranscript: z.string().describe("The transcription of the user's audio."),
    updatedStructuredSummary: AuditStructureSchema,
    updatedConversationHistory: z.array(ConversationTurnSchema),
    isAuditComplete: z.boolean(),
});
export type ConversationalAuditOutput = z.infer<typeof ConversationalAuditOutputSchema>;


// From work-plan-flow.ts
export const WorkPlanItemSchema = z.object({
    problem: z.string().describe("A concise description of the identified problem or weakness. Must be in Ukrainian."),
    solution: z.string().describe("A concise description of the proposed solution or desired future state. Must be in Ukrainian."),
});
export type WorkPlanItem = z.infer<typeof WorkPlanItemSchema>;

export const WorkPlanInputSchema = z.object({
    structuredSummary: AuditStructureSchema,
});
export type WorkPlanInput = z.infer<typeof WorkPlanInputSchema>;

export const WorkPlanOutputSchema = z.array(WorkPlanItemSchema);
export type WorkPlanOutput = z.infer<typeof WorkPlanOutputSchema>;
