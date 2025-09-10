

export type User = {
    id: string;
    name: string;
    avatar?: string;
};

export type SubResult = {
    id: string;
    name: string;
    completed: boolean;
    assignee?: User;
    deadline?: string;
}

export type ResultTask = {
    id: string;
    title: string;
    status: 'todo' | 'done';
}

export type ResultTemplate = {
    id: string;
    name: string;
    repeatability?: string;
}

export type ResultComment = {
    id: string;
    text: string;
    author: User;
    timestamp: string;
}


export interface Result {
  id: string;
  name: string;
  status: string;
  completed: boolean;
  isUrgent?: boolean;
  deadline: string;
  assignee: User;
  reporter: User;
  description: string;
  expectedResult: string;
  subResults: SubResult[];
  tasks: ResultTask[];
  templates: ResultTemplate[];
  comments: ResultComment[];
}
