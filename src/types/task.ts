
import type { ResultComment } from './result';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type TaskType = 'important-urgent' | 'important-not-urgent' | 'not-important-urgent' | 'not-important-not-urgent';

type User = {
    id?: string;
    name: string;
    avatar?: string;
};

export interface Task {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  dueDate: string;
  executionTime?: string; // e.g., "15:00"
  status: TaskStatus;
  type: TaskType;
  expectedTime: number; // in minutes
  actualTime?: number; // in minutes
  expectedResult?: string;
  actualResult?: string;
  assignee: User;
  reporter: User;
  resultId?: string;
  resultName?: string;
  comments?: ResultComment[];
}
