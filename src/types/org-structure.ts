
export interface Division {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface Position {
  id: string;
  name:string;
  divisionId: string;
  description: string;
  employeeIds: string[];
  linkedProcessIds: number;
  linkedKpiIds: number;
}

export interface Employee {
  id: string;
  name: string;
  avatar?: string;
}
