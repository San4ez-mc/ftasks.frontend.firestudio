
export type TaskGenerated = {
  id: string;
  date: string;
  status: 'done' | 'todo';
};

export type Template = {
  id: string;
  name: string;
  repeatability: string;
  startDate: string;
  tasksGenerated: TaskGenerated[];
  expectedResult?: string;
  resultId?: string;
  resultName?: string;
};
