'use server';

import { getUserSession } from '@/lib/session';
import { getCompanyProfileFromDb, updateCompanyProfileInDb } from '@/lib/firestore-service';
import type { CompanyProfile } from '@/types/company-profile';

export type SubscriptionStatus = {
    tier: 'free' | 'paid' | 'trial';
    daysRemaining: number | null;
    planName: string;
};

// Manual implementation to avoid date-fns dependency issues on the server.
function differenceInDays(dateLeft: Date, dateRight: Date): number {
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(dateLeft.getFullYear(), dateLeft.getMonth(), dateLeft.getDate());
    const utc2 = Date.UTC(dateRight.getFullYear(), dateRight.getMonth(), dateRight.getDate());
    return Math.floor((utc1 - utc2) / MS_PER_DAY);
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
    const session = await getUserSession();
    if (!session) return null;

    const companyProfile = await getCompanyProfileFromDb(session.companyId);
    if (!companyProfile) return null;

    const now = new Date();
    
    // Check for trial period first
    if (companyProfile.trialEnds && new Date(companyProfile.trialEnds) > now) {
        return {
            tier: 'trial',
            daysRemaining: differenceInDays(new Date(companyProfile.trialEnds), now),
            planName: 'Пробний період'
        };
    }
    
    // Check for active paid subscription
    if (companyProfile.subscriptionTier === 'paid' && companyProfile.subscriptionExpires && new Date(companyProfile.subscriptionExpires) > now) {
        return {
            tier: 'paid',
            daysRemaining: differenceInDays(new Date(companyProfile.subscriptionExpires), now),
            planName: 'Платний'
        };
    }

    // Default to free
    return {
        tier: 'free',
        daysRemaining: null,
        planName: 'Безкоштовний'
    };
}

export async function processSuccessfulPayment(companyId: string, planType: 'monthly' | 'yearly'): Promise<{success: boolean}> {
    const companyProfile = await getCompanyProfileFromDb(companyId);
    if (!companyProfile) return { success: false };

    const now = new Date();
    const currentExpiry = (companyProfile.subscriptionExpires && new Date(companyProfile.subscriptionExpires) > now)
        ? new Date(companyProfile.subscriptionExpires)
        : now;

    const newExpiryDate = new Date(currentExpiry);
    if (planType === 'yearly') {
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
    } else {
        newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
    }

    await updateCompanyProfileInDb(companyId, {
        subscriptionTier: 'paid',
        subscriptionExpires: newExpiryDate.toISOString(),
    });

    return { success: true };
}

export async function getCompanyId(): Promise<string | null> {
    const session = await getUserSession();
    return session?.companyId || null;
}
