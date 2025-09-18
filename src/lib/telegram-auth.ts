import { getDb } from './firebase-admin';
import type { User } from '@/types/user';
import { createSession } from './firestore-service';
import crypto from 'crypto';

const GROUP_LINK_CODE_EXPIRATION = 10 * 60 * 1000; // 10 minutes

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export async function findUserByTelegramId(telegramUserId: string): Promise<(User & { id: string }) | null> {
    const usersCollection = getDb().collection('users');
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

export async function handleTelegramLogin(telegramUser: TelegramUser, rememberMe: boolean): Promise<{ tempToken?: string; error?: string; details?: string }> {
  try {
    const { id: telegramUserId, first_name, last_name, username, photo_url } = telegramUser;

    if (!telegramUserId) {
        throw new Error('Telegram user ID is required in the data from Telegram.');
    }

    const usersCollection = getDb().collection('users');
    let userQuery = await usersCollection.where('telegramUserId', '==', telegramUserId.toString()).limit(1).get();
    let user: any;
    let details: string;

    if (userQuery.empty) {
      const newUserRef = usersCollection.doc();
      const newUser = {
        telegramUserId: telegramUserId.toString(),
        firstName: first_name,
        lastName: last_name || '',
        telegramUsername: username || '',
        avatar: photo_url || `https://i.pravatar.cc/150?u=${username || telegramUserId}`,
      };
      await newUserRef.set(newUser);
      user = { id: newUserRef.id, ...newUser };
      details = `New user ${first_name} created with ID ${user.id}.`;
    } else {
      const userDoc = userQuery.docs[0];
      user = { id: userDoc.id, ...userDoc.data() };
      details = `Existing user ${first_name} found with ID ${user.id}.`;
    }

    // Create a temporary session in Firestore
    const tempSessionExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const tempSession = await createSession({
        userId: user.id,
        rememberMe,
        expiresAt: tempSessionExpires.toISOString(),
        type: 'temp',
    });

    return { tempToken: tempSession.id, details };

  } catch (error) {
      const errorMessage = error instanceof Error ? `${error.name}: ${error.message}\nStack: ${error.stack}` : String(error);
      return { error: `Login Error: ${errorMessage}` };
  }
}

export async function generateGroupLinkCode(groupId: string, groupTitle: string): Promise<{ code?: string; error?: string }> {
    try {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiresAt = new Date(Date.now() + GROUP_LINK_CODE_EXPIRATION);

        await getDb().collection('groupLinkCodes').doc(code).set({
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
