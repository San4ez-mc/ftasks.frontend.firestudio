

export type StepStatus = 'new' | 'outdated' | 'problematic' | 'ok';

export type Step = {
    id: string;
    name: string;
    responsibleId: string;
    order: number;
    connections: { to: string }[];
    status: StepStatus;
    notes: string;
    isDataSavePoint?: boolean;
    dataSaveLocation?: string;
};

export type Lane = {
    id: string;
    role: string; // This will now store the Section Name
    sectionId: string; // Link to the Section from org-structure
    steps: Step[];
}

export type Process = {
  id: string;
  name: string;
  description: string;
  lanes: Lane[];
};

export type User = {
    id: string;
    name: string;
    avatar: string;
}
