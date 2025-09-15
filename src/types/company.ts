
export type EmployeeStatus = 'active' | 'vacation' | 'inactive';

export interface Employee {
    id: string;
    companyId: string;
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
    email?: string;
    birthDate?: string;
    telegramPermissions?: string[];
}
