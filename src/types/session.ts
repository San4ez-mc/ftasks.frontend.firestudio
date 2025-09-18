export interface Session {
    id: string;
    userId: string;
    companyId?: string; // Only present in permanent sessions
    rememberMe: boolean;
    expiresAt: string; // ISO date string
    type: 'temp' | 'permanent';
}
