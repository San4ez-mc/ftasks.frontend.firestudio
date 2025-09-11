
import { config } from 'dotenv';
config();

import '@/ai/flows/ai-task-prioritization.ts';
import '@/ai/flows/audit-summary-flow.ts';
import '@/ai/flows/telegram-command-flow.ts';
import '@/ai/flows/conversational-audit-flow.ts';
import '@/ai/flows/work-plan-flow.ts';
