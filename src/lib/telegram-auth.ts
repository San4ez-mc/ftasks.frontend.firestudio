
'use server';

import { getDb } from '@/lib/firebase-admin';
import type { User } from '@/types/user';

export async function findUserByTelegramId(telegramUserId: string): Promise<(User & { id: string }) | null> {
    const db = await getDb();
    const usersCollection = db.collection('users');
    const userQuery = await usersCollection.where('telegramUserId', '==', telegramUserId).limit(1).get();
    if (userQuery.empty) {
        return null;
    }
    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    
    if (userData.photo_url && !userData.avatar) {
        userData.avatar = userData.photo_url;
    }

    return { id: userDoc.id, ...userData } as (User & { id: string });
}

export async function generateGroupLinkCode(groupId: string, groupTitle: string): Promise<{ code?: string; error?: string }> {
    try {
        const db = await getDb();
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await db.collection('groupLinkCodes').doc(code).set({
            tgGroupId: groupId,
            groupTitle,
            expiresAt,
        });

        return { code };
    } catch (error) {
        console.error("Error generating group link code:", error);
        return { error: 'Could not generate a link code.' };
    }
}
