
// This file can be expanded with more detailed billing types later.

export interface SubscriptionPlan {
    id: 'free' | 'paid';
    name: string;
    priceMonthly: number;
    priceYearly: number;
    features: string[];
}
