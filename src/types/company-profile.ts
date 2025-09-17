
export interface CompanyProfile {
    id: string;
    name: string;
    description: string;
    adminId?: string;
    subscriptionTier?: 'free' | 'paid';
    subscriptionExpires?: string; // ISO date string
    trialEnds?: string; // ISO date string
}
