
export type EmployeeStatus = 'active' | 'vacation' | 'inactive';

export interface Employee {
    id: string;
    telegramUserId: string;
    telegramUsername: string;
    firstName: string;
    lastName: string;
    avatar: string;
    status: EmployeeStatus;
    notes: string;
    positions: string[];
    groups: string[];
    synonyms: string[];
}
