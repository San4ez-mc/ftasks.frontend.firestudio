export interface TelegramGroup {
    id: string;
    companyId: string;
    tgGroupId: string;
    title: string;
    tgUsername?: string;
    linkedAt: string; // ISO Date string
}

export interface MessageLog {
    id: string;
    companyId: string;
    groupId: string;
    timestamp: string; // ISO Date string
    content: string;
    status: 'OK' | 'Error';
    error?: string | null;
}
