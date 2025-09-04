
type User = {
    name: string;
    avatar?: string;
};

type SubResult = {
    id: string;
    name: string;
    completed: boolean;
}

type ResultTask = {
    id: string;
    title: string;
    status: 'todo' | 'done';
}

type ResultTemplate = {
    id: string;
    name: string;
}

export interface Result {
  id: string;
  name: string;
  status: string;
  completed: boolean;
  deadline: string;
  assignee: User;
  reporter: User;
  description: string;
  subResults: SubResult[];
  tasks: ResultTask[];
  templates: ResultTemplate[];
}
